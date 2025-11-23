
create extension if not exists "pgcrypto";


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


alter table public.entries add column if not exists content_tsv tsvector generated always as (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
) stored;


create index if not exists idx_entries_created_at on public.entries (created_at desc);
create index if not exists idx_entries_date on public.entries (date desc);
create index if not exists idx_entries_content_tsv on public.entries using gin (content_tsv);


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


alter table public.entries enable row level security;

create policy "Select own" on public.entries
  for select using (auth.uid() = user_id);

create policy "Insert own" on public.entries
  for insert with check (auth.uid() = user_id);

create policy "Update own" on public.entries
  for update using (auth.uid() = user_id);

create policy "Delete own" on public.entries
  for delete using (auth.uid() = user_id);


