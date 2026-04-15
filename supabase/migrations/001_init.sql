create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'worker');
create type public.account_status as enum ('active', 'resting', 'archived');
create type public.checkin_status as enum ('planned', 'in_progress', 'done', 'skipped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'worker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wallet_label text,
  wallet_address text,
  portfolio_url text,
  base_comment text,
  status public.account_status not null default 'active',
  assigned_worker_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_rotations (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  is_active boolean not null default false,
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (date, account_id)
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  status public.checkin_status not null default 'planned',
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  comment text,
  trades_count_manual integer check (trades_count_manual is null or trades_count_manual >= 0),
  extra_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, account_id)
);

create index accounts_assigned_worker_id_idx on public.accounts(assigned_worker_id);
create index daily_rotations_date_idx on public.daily_rotations(date);
create index daily_rotations_account_id_idx on public.daily_rotations(account_id);
create index daily_checkins_date_idx on public.daily_checkins(date);
create index daily_checkins_account_id_idx on public.daily_checkins(account_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

create trigger daily_checkins_set_updated_at
before update on public.daily_checkins
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'worker')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'owner'
$$;

create or replace function public.worker_can_access_account(account_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts a
    where a.id = account_uuid
      and a.assigned_worker_id = auth.uid()
      and a.status <> 'archived'
  )
$$;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.daily_rotations enable row level security;
alter table public.daily_checkins enable row level security;

create policy "owners can read profiles"
on public.profiles for select
using (public.is_owner());

create policy "workers can read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "owners can update profiles"
on public.profiles for update
using (public.is_owner())
with check (public.is_owner());

create policy "owner sees all accounts"
on public.accounts for select
using (public.is_owner());

create policy "worker sees assigned accounts"
on public.accounts for select
using (assigned_worker_id = auth.uid() and status <> 'archived');

create policy "owner inserts accounts"
on public.accounts for insert
with check (public.is_owner());

create policy "owner updates accounts"
on public.accounts for update
using (public.is_owner())
with check (public.is_owner());

create policy "owner deletes accounts"
on public.accounts for delete
using (public.is_owner());

create policy "owner sees rotations"
on public.daily_rotations for select
using (public.is_owner());

create policy "worker sees assigned rotations"
on public.daily_rotations for select
using (public.worker_can_access_account(account_id));

create policy "owner writes rotations"
on public.daily_rotations for insert
with check (public.is_owner());

create policy "owner updates rotations"
on public.daily_rotations for update
using (public.is_owner())
with check (public.is_owner());

create policy "owner deletes rotations"
on public.daily_rotations for delete
using (public.is_owner());

create policy "owner sees checkins"
on public.daily_checkins for select
using (public.is_owner());

create policy "worker sees assigned checkins"
on public.daily_checkins for select
using (public.worker_can_access_account(account_id));

create policy "owner inserts checkins"
on public.daily_checkins for insert
with check (public.is_owner());

create policy "worker inserts own account checkins"
on public.daily_checkins for insert
with check (public.worker_can_access_account(account_id));

create policy "owner updates checkins"
on public.daily_checkins for update
using (public.is_owner())
with check (public.is_owner());

create policy "worker updates own account checkins"
on public.daily_checkins for update
using (public.worker_can_access_account(account_id))
with check (public.worker_can_access_account(account_id));

create policy "owner deletes checkins"
on public.daily_checkins for delete
using (public.is_owner());
