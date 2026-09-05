-- Image attachments for notes. Run once in the Supabase SQL Editor,
-- after 002_add_auth.sql.
--
-- Files live in a PRIVATE storage bucket, not in Postgres, so note rows
-- stay small. The bucket is private because a public bucket would serve
-- every image to anyone holding the URL, regardless of who owns the note.
-- The app reads them back through short-lived signed URLs instead.
--
-- Objects are stored at:  <user_id>/<note_id>/<uuid>.<ext>
-- so the first path segment is the owner, which is what the storage
-- policies below key off.

-- 1. The bucket -------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  false,
  5242880, -- 5 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. The metadata table -----------------------------------------------

create table if not exists note_images (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  storage_path text not null unique,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists note_images_note_id_idx on note_images (note_id);

alter table note_images enable row level security;

drop policy if exists "owner manages note images" on note_images;
create policy "owner manages note images" on note_images
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    -- and the note being attached to must also belong to the caller
    and exists (
      select 1 from notes
      where notes.id = note_images.note_id
        and notes.user_id = auth.uid()
    )
  );

-- 3. Storage access ----------------------------------------------------
-- Each user may only touch objects under their own <user_id>/ prefix.

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
