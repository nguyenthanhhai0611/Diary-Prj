-- Migration: create entries table and RLS policies for Supabase
-- Run this in Supabase SQL editor (Project -> SQL Editor)

-- enable uuid generation
create extension if not exists "pgcrypto";

-- main entries table
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date date,
  title text,
  content text,
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- generated tsvector for full-text search (optional)
alter table public.entries add column if not exists content_tsv tsvector generated always as (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
) stored;

-- indexes
create index if not exists idx_entries_created_at on public.entries (created_at desc);
create index if not exists idx_entries_date on public.entries (date desc);
create index if not exists idx_entries_content_tsv on public.entries using gin (content_tsv);

-- trigger to update updated_at
create or replace function public.trigger_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_entries_updated_at on public.entries;
create trigger trg_entries_updated_at
  before update on public.entries
  for each row execute function public.trigger_set_updated_at();

-- Row Level Security (RLS) policies: require users to only access their own rows
alter table public.entries enable row level security;

-- select: allow if the row is public (is_public true) OR owned by the authenticated user
-- (we didn't add is_public column by default above; if you add it, adjust policy accordingly)
create policy "Select own" on public.entries
  for select using (auth.uid() = user_id);

create policy "Insert own" on public.entries
  for insert with check (auth.uid() = user_id);

create policy "Update own" on public.entries
  for update using (auth.uid() = user_id);

create policy "Delete own" on public.entries
  for delete using (auth.uid() = user_id);

-- Note: If you want public entries, add an is_public boolean column and a policy to allow
-- select when is_public = true.
