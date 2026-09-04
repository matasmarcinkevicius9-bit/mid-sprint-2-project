-- Notes app schema. Run once in the Supabase SQL Editor.
-- Single-user app, no auth: RLS is enabled with a permissive policy so the
-- anon key can read/write everything. Anyone with the project URL + anon
-- key has full access to this data — acceptable for a personal/local tool,
-- but do not treat this as a template for a multi-user app.

create extension if not exists pgcrypto;

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete set null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists note_tags (
  note_id uuid not null references notes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notes_set_updated_at on notes;
create trigger notes_set_updated_at
before update on notes
for each row execute function set_updated_at();

alter table collections enable row level security;
alter table tags enable row level security;
alter table notes enable row level security;
alter table note_tags enable row level security;

drop policy if exists "allow all" on collections;
create policy "allow all" on collections for all using (true) with check (true);

drop policy if exists "allow all" on tags;
create policy "allow all" on tags for all using (true) with check (true);

drop policy if exists "allow all" on notes;
create policy "allow all" on notes for all using (true) with check (true);

drop policy if exists "allow all" on note_tags;
create policy "allow all" on note_tags for all using (true) with check (true);
