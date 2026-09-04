-- Adds note sharing (by email, view+comment only) and comments on top of
-- 001_schema.sql / 002_add_auth.sql. Run once in the Supabase SQL Editor.

create table if not exists note_shares (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  shared_with_user_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  created_at timestamptz not null default now(),
  unique (note_id, shared_with_user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table note_shares enable row level security;
alter table comments enable row level security;

-- owner manages (add/list/revoke) shares on their own notes
drop policy if exists "owner manages shares" on note_shares;
create policy "owner manages shares" on note_shares for all
  using (exists (select 1 from notes where notes.id = note_shares.note_id and notes.user_id = auth.uid()))
  with check (exists (select 1 from notes where notes.id = note_shares.note_id and notes.user_id = auth.uid()));

-- recipients can see their own share row (so they know what's shared with them)
drop policy if exists "recipient sees own share" on note_shares;
create policy "recipient sees own share" on note_shares for select
  using (shared_with_user_id = auth.uid());

-- notes: additive select-only policy for shared viewers. The existing
-- owner policy from 002_add_auth.sql already covers full owner access;
-- RLS policies for the same command are OR'd, so this only ever *adds*
-- read access, never edit/delete.
drop policy if exists "shared users can view" on notes;
create policy "shared users can view" on notes for select
  using (exists (select 1 from note_shares where note_shares.note_id = notes.id and note_shares.shared_with_user_id = auth.uid()));

-- comments: readable/writable by anyone who can view the note (owner or shared)
drop policy if exists "viewers can read comments" on comments;
create policy "viewers can read comments" on comments for select using (
  exists (select 1 from notes where notes.id = comments.note_id and notes.user_id = auth.uid())
  or exists (select 1 from note_shares where note_shares.note_id = comments.note_id and note_shares.shared_with_user_id = auth.uid())
);

drop policy if exists "viewers can write comments" on comments;
create policy "viewers can write comments" on comments for insert with check (
  author_id = auth.uid() and (
    exists (select 1 from notes where notes.id = comments.note_id and notes.user_id = auth.uid())
    or exists (select 1 from note_shares where note_shares.note_id = comments.note_id and note_shares.shared_with_user_id = auth.uid())
  )
);

drop policy if exists "authors delete own comments" on comments;
create policy "authors delete own comments" on comments for delete using (author_id = auth.uid());

-- share-by-email RPC (security definer — the only code that may read auth.users)
create or replace function share_note_by_email(p_note_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_target_user_id uuid;
  v_target_email text;
begin
  select user_id into v_owner from notes where id = p_note_id;
  if v_owner is null then
    raise exception 'Note not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Only the owner can share this note';
  end if;

  select id, email into v_target_user_id, v_target_email
  from auth.users where lower(email) = lower(p_email) limit 1;

  if v_target_user_id is null then
    raise exception 'No account found for that email';
  end if;
  if v_target_user_id = v_owner then
    raise exception 'You already own this note';
  end if;

  insert into note_shares (note_id, shared_with_user_id, shared_with_email)
  values (p_note_id, v_target_user_id, v_target_email)
  on conflict (note_id, shared_with_user_id) do nothing;
end;
$$;

grant execute on function share_note_by_email(uuid, text) to authenticated;
