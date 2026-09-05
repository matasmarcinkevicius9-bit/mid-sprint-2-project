-- Image attachments for notes: table + row-level security ONLY.
-- Run this in the Supabase SQL Editor after 002_add_auth.sql.
--
-- The storage bucket and its policies are handled separately in
-- 005_note_images_storage.sql, because statements touching the storage
-- schema can be rejected depending on project permissions, and a single
-- failing statement would roll back this whole script.

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
    -- the note being attached to must also belong to the caller
    and exists (
      select 1 from notes
      where notes.id = note_images.note_id
        and notes.user_id = auth.uid()
    )
  );
