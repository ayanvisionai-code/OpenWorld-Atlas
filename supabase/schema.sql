-- ============================================================================
-- OpenWorld Atlas — Supabase schema migration (safe: creates only, drops nothing)
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

-- Extensions for search (safe if already present)
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Categories & tags
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Sources & citations
-- ----------------------------------------------------------------------------
create table if not exists public.sources (
  id           uuid primary key default gen_random_uuid(),
  name         text,                     -- e.g. "PowerPyx"
  url          text not null unique,     -- canonical source URL
  publisher    text,
  retrieved_at date,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Unified content table (characters, vehicles, weapons, locations,
--    missions, cheat codes, guides, news, blog posts, faqs)
--    Entity-specific fields live in `fields` jsonb so the existing frontend
--    renderers keep working unchanged.
-- ----------------------------------------------------------------------------
create table if not exists public.content (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null check (type in
                       ('character','vehicle','weapon','location','mission',
                        'cheat','guide','news','blog','faq')),
  slug               text not null,                    -- URL id, e.g. 'money-250k'
  title              text not null,
  description        text,                             -- short summary (meta/lead)
  body               text,                             -- long-form content (markdown/html)
  featured_image_url text,
  image_alt          text,
  image_attribution  text,                             -- credit/licence line
  status             text not null default 'draft' check (status in ('draft','published')),
  verification       text check (verification in
                       ('CONFIRMED','SUPPORTED','UNCONFIRMED','SPECULATION','NOT_AVAILABLE')),
  verified_at        date,                             -- last fact-check date
  published_at       timestamptz,
  fields             jsonb not null default '{}',      -- full entity record (id, inputs, stats…)
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (type, slug)
);

create index if not exists content_type_status_idx on public.content (type, status);
create index if not exists content_slug_idx        on public.content (slug);
create index if not exists content_fields_gin_idx  on public.content using gin (fields jsonb_path_ops);
create index if not exists content_title_trgm_idx  on public.content using gin (title gin_trgm_ops);
create index if not exists content_desc_trgm_idx   on public.content using gin (coalesce(description,'') gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- 4. Junction tables
-- ----------------------------------------------------------------------------
create table if not exists public.content_categories (
  content_id   uuid not null references public.content(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  primary key (content_id, category_id)
);

create table if not exists public.content_tags (
  content_id uuid not null references public.content(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

create table if not exists public.content_sources (
  content_id uuid not null references public.content(id) on delete cascade,
  source_id  uuid not null references public.sources(id) on delete cascade,
  note       text,
  primary key (content_id, source_id)
);

-- ----------------------------------------------------------------------------
-- 5. Media assets (attribution & licence metadata mandatory per policy)
-- ----------------------------------------------------------------------------
create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  bucket_path   text not null,              -- path inside the 'media' storage bucket
  url           text not null,
  alt           text not null default '',
  attribution   text not null default 'Original artwork — this site',
  license       text not null default 'Site-original',
  width         int,
  height        int,
  size_bytes    bigint,
  content_id    uuid references public.content(id) on delete set null,
  uploaded_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. Contact / content-request submissions
--    anon can INSERT only; nobody anonymous can read.
-- ----------------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(question) between 8 and 500),
  category   text not null default 'Other',
  email      text,                                -- optional, never published
  user_agent text,
  status     text not null default 'new' check (status in ('new','read','done')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists content_updated_at on public.content;
create trigger content_updated_at before update on public.content
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public: read published content only. Editorial access is restricted to
-- explicitly assigned administrators; being authenticated is not sufficient.
-- ============================================================================
alter table public.content             enable row level security;
alter table public.categories          enable row level security;
alter table public.tags                enable row level security;
alter table public.sources             enable row level security;
alter table public.content_categories  enable row level security;
alter table public.content_tags        enable row level security;
alter table public.content_sources     enable row level security;
alter table public.media_assets        enable row level security;
alter table public.contact_submissions enable row level security;

-- A separate role table prevents any newly-created Auth user from becoming an
-- editor by accident. Grant the first role manually after creating the owner:
-- insert into public.user_roles (user_id, role) values ('AUTH-USER-UUID', 'admin');
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

create or replace function public.is_editor()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'editor')
  );
$$;

revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to anon, authenticated;

drop policy if exists "admins read roles" on public.user_roles;
create policy "admins read roles" on public.user_roles
  for select to authenticated using (public.is_editor());

-- --- content -----------------------------------------------------------------
drop policy if exists "public read published content" on public.content;
create policy "public read published content" on public.content
  for select using (status = 'published');

drop policy if exists "admins manage content" on public.content;
drop policy if exists "editors manage content" on public.content;
create policy "editors manage content" on public.content
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- --- reference tables: public read, admin write -------------------------------
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);
drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "editors manage categories" on public.categories;
create policy "editors manage categories" on public.categories
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags
  for select using (true);
drop policy if exists "admins manage tags" on public.tags;
drop policy if exists "editors manage tags" on public.tags;
create policy "editors manage tags" on public.tags
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "public read sources" on public.sources;
create policy "public read sources" on public.sources
  for select using (true);
drop policy if exists "admins manage sources" on public.sources;
drop policy if exists "editors manage sources" on public.sources;
create policy "editors manage sources" on public.sources
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "public read content_categories" on public.content_categories;
create policy "public read content_categories" on public.content_categories
  for select using (true);
drop policy if exists "admins manage content_categories" on public.content_categories;
drop policy if exists "editors manage content_categories" on public.content_categories;
create policy "editors manage content_categories" on public.content_categories
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "public read content_tags" on public.content_tags;
create policy "public read content_tags" on public.content_tags
  for select using (true);
drop policy if exists "admins manage content_tags" on public.content_tags;
drop policy if exists "editors manage content_tags" on public.content_tags;
create policy "editors manage content_tags" on public.content_tags
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "public read content_sources" on public.content_sources;
create policy "public read content_sources" on public.content_sources
  for select using (true);
drop policy if exists "admins manage content_sources" on public.content_sources;
drop policy if exists "editors manage content_sources" on public.content_sources;
create policy "editors manage content_sources" on public.content_sources
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- --- media_assets -------------------------------------------------------------
drop policy if exists "public read media" on public.media_assets;
create policy "public read media" on public.media_assets
  for select using (true);
drop policy if exists "admins manage media" on public.media_assets;
drop policy if exists "editors manage media" on public.media_assets;
create policy "editors manage media" on public.media_assets
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- --- contact_submissions ------------------------------------------------------
drop policy if exists "anon submit contact" on public.contact_submissions;
create policy "anon submit contact" on public.contact_submissions
  for insert to anon, authenticated with check (true);

drop policy if exists "admins read contact" on public.contact_submissions;
drop policy if exists "editors read contact" on public.contact_submissions;
create policy "editors read contact" on public.contact_submissions
  for select to authenticated using (public.is_editor());
drop policy if exists "admins update contact" on public.contact_submissions;
drop policy if exists "editors update contact" on public.contact_submissions;
create policy "editors update contact" on public.contact_submissions
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
drop policy if exists "admins delete contact" on public.contact_submissions;
drop policy if exists "editors delete contact" on public.contact_submissions;
create policy "editors delete contact" on public.contact_submissions
  for delete to authenticated using (public.is_editor());

-- ============================================================================
-- STORAGE — bucket 'media': public images, admin upload only.
-- The bucket itself is created in the Dashboard (Storage → New bucket,
-- name: media, Public bucket: ON). These object policies add guardrails:
-- only images, max 5 MB.
-- ============================================================================
drop policy if exists "public read media objects" on storage.objects;
create policy "public read media objects" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "admins upload media objects" on storage.objects;
drop policy if exists "editors upload media objects" on storage.objects;
create policy "editors upload media objects" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media' and public.is_editor()
    and (metadata->>'mimetype') in
      ('image/jpeg','image/png','image/webp','image/svg+xml','image/avif')
    and coalesce((metadata->>'size')::bigint, 0) <= 5242880
  );

drop policy if exists "admins update media objects" on storage.objects;
drop policy if exists "editors update media objects" on storage.objects;
create policy "editors update media objects" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_editor())
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "admins delete media objects" on storage.objects;
drop policy if exists "editors delete media objects" on storage.objects;
create policy "editors delete media objects" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_editor());
