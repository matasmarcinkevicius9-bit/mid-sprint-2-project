-- Storage bucket and access policies for note images.
-- Run this AFTER 004_note_images.sql.
--
-- If any statement here is rejected on permissions, create the bucket
-- through the dashboard instead (Storage > New bucket):
--   name: note-images   public: OFF   file size limit: 5 MB
--   allowed MIME types: image/png, image/jpeg, image/webp, image/gif
-- then add the three policies below via Storage > Policies.
--
-- Objects are stored at <user_id>/<note_id>/<uuid>.<ext>, so the first
-- path segment identifies the owner. That is what these policies key off.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "note images: read own" on storage.objects;
create policy "note images: read own" on storage.objects
  for select
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "note images: upload own" on storage.objects;
create policy "note images: upload own" on storage.objects
  for insert
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "note images: delete own" on storage.objects;
create policy "note images: delete own" on storage.objects
  for delete
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
