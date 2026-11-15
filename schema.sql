-- Small Task database starter. Run in Supabase SQL Editor.
-- IMPORTANT: Set the first admin manually after creating your account:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.task_status as enum ('draft', 'published', 'paused', 'closed');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.withdrawal_status as enum ('pending', 'approved', 'paid', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  instructions text not null,
  category text not null default 'General',
  reward_usd numeric(12,2) not null check (reward_usd > 0),
  slots_total integer not null default 1 check (slots_total > 0),
  slots_filled integer not null default 0 check (slots_filled >= 0),
  status public.task_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  user_id uuid not null references public.profiles(id),
  proof_text text not null,
  proof_url text,
  status public.submission_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(task_id, user_id)
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance_usd numeric(12,2) not null default 0 check (balance_usd >= 0),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  amount_usd numeric(12,2) not null,
  kind text not null check (kind in ('task_reward', 'withdrawal', 'refund', 'adjustment')),
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  amount_usd numeric(12,2) not null check (amount_usd >= 1),
  binance_pay_id text not null,
  status public.withdrawal_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Create profile and empty wallet whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Member'));
  insert into public.wallets(user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable RLS on every application table.
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;

-- Helper: admin status is derived from protected profile role.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "Profiles readable by owner or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "Users update own display name" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid() and role = 'user');

create policy "Published tasks visible to signed-in users" on public.tasks
for select using (status = 'published' or public.is_admin());
create policy "Admins manage tasks" on public.tasks
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own submissions; admins read all" on public.submissions
for select using (user_id = auth.uid() or public.is_admin());
create policy "Users submit own work" on public.submissions
for insert with check (user_id = auth.uid() and status = 'pending');
create policy "Admins review submissions" on public.submissions
for update using (public.is_admin()) with check (public.is_admin());

create policy "Users read own wallet" on public.wallets
for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage wallets" on public.wallets
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own transactions" on public.wallet_transactions
for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins add transactions" on public.wallet_transactions
for insert with check (public.is_admin());

create policy "Users read own withdrawals" on public.withdrawals
for select using (user_id = auth.uid() or public.is_admin());
create policy "Users request own withdrawals" on public.withdrawals
for insert with check (
  user_id = auth.uid() and status = 'pending' and amount_usd >= 1
);
create policy "Admins process withdrawals" on public.withdrawals
for update using (public.is_admin()) with check (public.is_admin());

-- Production note: implement task approval + wallet credit and withdrawal reservation
-- in SECURITY DEFINER database functions/transactions before accepting real funds.
-- Never expose the Supabase service-role key in browser/client code.
