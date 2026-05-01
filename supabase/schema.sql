-- ============================================================
-- Invicta.ai — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles (one per user, auto-created on signup)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Manually insert profiles for existing users (run once)
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- Leads table
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  address text not null,
  owner_name text,
  phone text,
  email text,
  ask_price bigint,
  arv bigint,
  repair_est bigint,
  beds int,
  baths numeric(3,1),
  sqft int,
  year_built int,
  source text default 'Manual',
  stage text default 'new',
  notes text,
  assigned_to uuid references auth.users(id),
  assigned_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log (every action on a lead)
create table public.lead_activity (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  details text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activity enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- Leads — all authenticated users can read/write
create policy "leads_select" on public.leads for select to authenticated using (true);
create policy "leads_insert" on public.leads for insert to authenticated with check (true);
create policy "leads_update" on public.leads for update to authenticated using (true);
create policy "leads_delete" on public.leads for delete to authenticated using (true);

-- Activity — all can read, insert own
create policy "activity_select" on public.lead_activity for select to authenticated using (true);
create policy "activity_insert" on public.lead_activity for insert to authenticated with check (auth.uid() = user_id);

-- Cash Buyers
create table public.buyers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  email text,
  markets text[] default '{}',
  min_price bigint,
  max_price bigint,
  prop_types text[] default '{}',
  cash_proof boolean default false,
  deals_completed int default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.buyers enable row level security;
create policy "buyers_select" on public.buyers for select to authenticated using (true);
create policy "buyers_insert" on public.buyers for insert to authenticated with check (true);
create policy "buyers_update" on public.buyers for update to authenticated using (true);
create policy "buyers_delete" on public.buyers for delete to authenticated using (true);

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.lead_activity;
