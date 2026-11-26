-- OpenWorld Atlas — minimal public content access repair
-- Run once in Supabase Dashboard → SQL Editor after reviewing this file.
-- It preserves RLS. The existing `public read published content` policy still
-- limits anonymous visitors to rows where status = 'published'.

grant usage on schema public to anon, authenticated;
grant select on public.content to anon, authenticated;
grant select on public.categories, public.tags, public.sources,
  public.content_categories, public.content_tags, public.content_sources,
  public.media_assets to anon, authenticated;
grant insert on public.contact_submissions to anon, authenticated;
