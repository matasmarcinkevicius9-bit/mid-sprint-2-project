-- Tightens policies flagged by the security audit. Run once in the Supabase
-- SQL Editor after 005_note_images_storage.sql. Safe to re-run.

-- note_tags: the tag must belong to the caller too, not only the note.
-- Without this a user could link another user's tag id to their own note
-- and learn from the result whether that tag id exists.
drop policy if exists "owner access" on note_tags;
create policy "owner access" on note_tags
  for all using (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = (select auth.uid()))
    and exists (select 1 from tags where tags.id = note_tags.tag_id and tags.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = (select auth.uid()))
    and exists (select 1 from tags where tags.id = note_tags.tag_id and tags.user_id = (select auth.uid()))
  );

-- The tag-side check and the "on delete cascade" from tags both look up
-- note_tags by tag_id; the primary key (note_id, tag_id) cannot serve that.
create index if not exists note_tags_tag_id_idx on note_tags (tag_id);

-- note_images: storage_path must sit under <user_id>/<note_id>/, the same
-- layout the storage policies key off. Otherwise a row could claim any
-- path, including one in another user's folder, and since storage_path is
-- unique that would block the real owner's insert.
drop policy if exists "owner manages note images" on note_images;
create policy "owner manages note images" on note_images
  for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    -- the note being attached to must also belong to the caller
    and exists (
      select 1 from notes
      where notes.id = note_images.note_id
        and notes.user_id = (select auth.uid())
    )
    and starts_with(storage_path, (select auth.uid())::text || '/' || note_id::text || '/')
  );

-- Pin search_path so the trigger function cannot be redirected to objects
-- created in another schema. now() lives in pg_catalog, which is always
-- searched, so an empty path is enough.
alter function public.set_updated_at() set search_path = '';
