-- ClinicFlow (Supabase Auth) reset schema
-- This wipes legacy tables and recreates `public.visits` owned by `auth.users`.
-- Run in Supabase SQL editor. This is destructive.

begin;

-- Drop legacy app-auth tables (safe if they don't exist)
drop table if exists public.password_reset_tokens cascade;
drop table if exists public.verification_tokens cascade;
drop table if exists public.sessions cascade;
drop table if exists public.accounts cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

-- Drop visits last so dependencies are cleared
drop table if exists public.visits cascade;

create table public.visits (
  id serial primary key,
  account_id uuid not null,
  patient_name text not null,
  phone_number text,
  age integer,
  mutuelle text not null default 'Non' check (mutuelle in ('Oui','Non')),
  mutuelle_remplie text not null default 'Non' check (mutuelle_remplie in ('Oui','Non')),
  arrival_time timestamptz not null default now(),
  condition text not null,
  status text not null default 'waiting' check (status in ('waiting','in_consultation','done','left')),
  price integer,
  next_step text,
  last_updated_by uuid,
  visit_date date not null default (now() at time zone 'utc')::date
);

alter table public.visits
  add constraint visits_account_id_auth_users_fk
  foreign key (account_id) references auth.users (id) on delete cascade;

alter table public.visits
  add constraint visits_last_updated_by_auth_users_fk
  foreign key (last_updated_by) references auth.users (id) on delete set null;

-- Enable RLS so Supabase Realtime + direct SQL viewing behaves per-user
alter table public.visits enable row level security;

create policy "visits_select_own"
on public.visits for select
using (account_id = auth.uid());

create policy "visits_insert_own"
on public.visits for insert
with check (account_id = auth.uid());

create policy "visits_update_own"
on public.visits for update
using (account_id = auth.uid())
with check (account_id = auth.uid());

create policy "visits_delete_own"
on public.visits for delete
using (account_id = auth.uid());

-- Ensure table is in Supabase Realtime publication (needed for `postgres_changes`)
do $$
begin
  begin
    alter publication supabase_realtime add table public.visits;
  exception when others then
    -- If it already exists or publication name differs, ignore and enable manually in the UI.
    null;
  end;
end $$;

commit;

