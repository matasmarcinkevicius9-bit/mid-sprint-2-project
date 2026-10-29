-- Second round of fixes from the security audit. Run once in the Supabase
-- SQL Editor after 006_tighten_policies.sql. Safe to re-run.
--
-- Every policy is recreated with:
--   - "to authenticated", so policies are not evaluated for signed-out
--     (anon) requests at all, rather than relying on auth.uid() being null
--   - "(select auth.uid())", so the call is evaluated once per statement
--     instead of once per row

-- collections / tags: plain owner policies.
drop policy if exists "owner access" on collections;
create policy "owner access" on collections
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "owner access" on tags;
create policy "owner access" on tags
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- notes: collection_id must point at one of the caller's own collections.
-- Without this a user could file a note under another user's collection id
-- and learn from the result whether that id exists.
drop policy if exists "owner access" on notes;
create policy "owner access" on notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      collection_id is null
      or exists (
        select 1 from collections
        where collections.id = notes.collection_id
          and collections.user_id = (select auth.uid())
      )
    )
  );

-- Backs the collection check above and the "on delete set null" from
-- collections, both of which look up notes by collection_id.
create index if not exists notes_collection_id_idx on notes (collection_id);

-- note_tags: same both-sides check as 006, now restricted to authenticated.
drop policy if exists "owner access" on note_tags;
create policy "owner access" on note_tags
  for all to authenticated
  using (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = (select auth.uid()))
    and exists (select 1 from tags where tags.id = note_tags.tag_id and tags.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = (select auth.uid()))
    and exists (select 1 from tags where tags.id = note_tags.tag_id and tags.user_id = (select auth.uid()))
  );

-- note_images: same rules as 006, now restricted to authenticated.
drop policy if exists "owner manages note images" on note_images;
create policy "owner manages note images" on note_images
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from notes
      where notes.id = note_images.note_id
        and notes.user_id = (select auth.uid())
    )
    and starts_with(storage_path, (select auth.uid())::text || '/' || note_id::text || '/')
  );

-- Storage. Read and delete stay keyed off the first path segment only, so
-- a note's files can still be removed while the note is being deleted.
drop policy if exists "note images: read own" on storage.objects;
create policy "note images: read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Uploads must also go into the folder of a note the caller owns. Without
-- this any signed-up account could fill the bucket with files that belong
-- to no note and are never cleaned up.
drop policy if exists "note images: upload own" on storage.objects;
create policy "note images: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.notes
      where notes.id::text = (storage.foldername(objects.name))[2]
        and notes.user_id = (select auth.uid())
    )
  );

drop policy if exists "note images: delete own" on storage.objects;
create policy "note images: delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
