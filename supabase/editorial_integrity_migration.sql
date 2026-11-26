-- OpenWorld Atlas — editorial integrity migration
-- Review and run once in Supabase SQL Editor. It preserves every content row.
-- Existing published records become `needs_review` and disappear from public
-- pages until an editor reviews and explicitly approves them.

alter table public.content
  add column if not exists editorial_status text not null default 'needs_review'
  check (editorial_status in ('needs_review', 'approved', 'corrected', 'archived'));

alter table public.content
  add column if not exists reviewed_at date,
  add column if not exists correction_note text;

alter table public.content
  drop constraint if exists content_verification_check;
alter table public.content
  add constraint content_verification_check check (verification in
    ('OFFICIALLY_CONFIRMED','INDEPENDENTLY_VERIFIED','REPORTED',
     'UNCONFIRMED','SPECULATION','UNKNOWN','CORRECTED_OUTDATED'));

-- A public page may show only an intentionally published and approved record.
drop policy if exists "public read published content" on public.content;
create policy "public read approved published content" on public.content
  for select using (status = 'published' and editorial_status = 'approved');

create index if not exists content_public_editorial_idx
  on public.content (status, editorial_status, updated_at desc);

-- Optional review starting point. Inspect the result before approving any row.
-- select type, slug, title, verification, verified_at, editorial_status
-- from public.content order by updated_at desc;
