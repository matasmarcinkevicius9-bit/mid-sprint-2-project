-- Adds per-user auth (email/password + Google via Supabase Auth) on top of
-- the initial schema.sql. Run once in the Supabase SQL Editor, after
-- schema.sql. Safe to run because collections/tags/notes are empty.

alter table collections add column user_id uuid not null references auth.users(id) on delete cascade default auth.uid();
alter table tags add column user_id uuid not null references auth.users(id) on delete cascade default auth.uid();
alter table notes add column user_id uuid not null references auth.users(id) on delete cascade default auth.uid();

alter table tags drop constraint if exists tags_name_key;
alter table tags add constraint tags_user_id_name_key unique (user_id, name);

drop policy if exists "allow all" on collections;
create policy "owner access" on collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all" on tags;
create policy "owner access" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all" on notes;
create policy "owner access" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all" on note_tags;
create policy "owner access" on note_tags
  for all using (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid())
  )
  with check (
    exists (select 1 from notes where notes.id = note_tags.note_id and notes.user_id = auth.uid())
  );
