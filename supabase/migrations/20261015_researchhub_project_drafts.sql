-- ResearchHub account profiles and saved project drafts.
-- Run this migration in the Supabase SQL editor for the Supabase project used by ResearchHub.

create extension if not exists pgcrypto;

create table if not exists public.project_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 250),
  department text not null,
  academic_level text not null,
  study_setting text not null default '',
  research_problem text not null default '',
  aim text not null default '',
  methodology text not null default 'Survey',
  population text not null default '',
  supervisor_notes text not null default '',
  outline text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_drafts enable row level security;
drop policy if exists "Users can read own project drafts" on public.project_drafts;
drop policy if exists "Users can create own project drafts" on public.project_drafts;
drop policy if exists "Users can update own project drafts" on public.project_drafts;
drop policy if exists "Users can delete own project drafts" on public.project_drafts;

create policy "Users can read own project drafts" on public.project_drafts
  for select using (auth.uid() = user_id);
create policy "Users can create own project drafts" on public.project_drafts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own project drafts" on public.project_drafts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own project drafts" on public.project_drafts
  for delete using (auth.uid() = user_id);

-- Create customer-only profiles on sign-up. Never trust client metadata to set a role.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_researchhub on auth.users;
create trigger on_auth_user_created_researchhub
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Backfill customer profiles for accounts that existed before this trigger.
insert into public.profiles (id, display_name, role)
select id, coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), ''), 'customer'
from auth.users
on conflict (id) do nothing;
