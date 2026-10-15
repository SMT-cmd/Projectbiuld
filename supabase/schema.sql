create extension if not exists pgcrypto;
create table if not exists public.departments (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text not null default '', created_at timestamptz not null default now());
create table if not exists public.topics (id uuid primary key default gen_random_uuid(), department_id uuid references public.departments(id) on delete set null, title text not null, slug text not null unique, summary text not null default '', abstract text not null default '', tags text[] not null default '{}', price_kobo integer not null default 500000 check (price_kobo > 0), cover_image_url text, is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.requests (id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text not null default '', department text not null, topic text not null, support_type text not null, target_date date, details text not null default '', status text not null default 'new' check (status in ('new','reviewing','responded','closed')), created_at timestamptz not null default now());
create table if not exists public.orders (id uuid primary key default gen_random_uuid(), customer_email text not null, customer_name text not null, topic_id uuid references public.topics(id) on delete set null, amount_kobo integer not null check (amount_kobo > 0), currency text not null default 'NGN', payment_reference text unique, payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')), delivery_status text not null default 'pending' check (delivery_status in ('pending','ready','delivered')), private_asset_public_id text, created_at timestamptz not null default now(), paid_at timestamptz);
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, role text not null default 'customer' check (role in ('customer','admin')), created_at timestamptz not null default now());
alter table public.departments enable row level security;
alter table public.topics enable row level security;
alter table public.requests enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
create policy "Public can view published topics" on public.topics for select using (is_published = true);
create policy "Public can view departments" on public.departments for select using (true);
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
-- Request/order writes are server-side only; do not expose service-role credentials to browsers.

alter table public.topics add column if not exists price_kobo integer not null default 500000 check (price_kobo > 0);
