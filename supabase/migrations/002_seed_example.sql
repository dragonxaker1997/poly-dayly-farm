-- Local/demo seed. Password for both users: password123
-- In hosted Supabase, you can also create users in Auth UI and then update profile roles manually.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'worker@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@example.com"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"worker@example.com"}',
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do nothing;

insert into public.profiles (id, email, role)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'worker@example.com', 'worker')
on conflict (id) do update
set email = excluded.email,
    role = excluded.role;

insert into public.accounts (
  name,
  wallet_label,
  wallet_address,
  portfolio_url,
  base_comment,
  status,
  assigned_worker_id
)
values
  ('A1', 'Wallet A1', '0x-demo-a1', 'https://polymarket.com/profile/demo-a1', 'Warm account. Keep activity light.', 'active', '22222222-2222-2222-2222-222222222222'),
  ('A2', 'Wallet A2', '0x-demo-a2', 'https://polymarket.com/profile/demo-a2', 'Check open positions before action.', 'active', '22222222-2222-2222-2222-222222222222'),
  ('A3', 'Wallet A3', '0x-demo-a3', 'https://polymarket.com/profile/demo-a3', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A4', 'Wallet A4', '0x-demo-a4', 'https://polymarket.com/profile/demo-a4', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A5', 'Wallet A5', '0x-demo-a5', 'https://polymarket.com/profile/demo-a5', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A6', 'Wallet A6', '0x-demo-a6', 'https://polymarket.com/profile/demo-a6', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A7', 'Wallet A7', '0x-demo-a7', 'https://polymarket.com/profile/demo-a7', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A8', 'Wallet A8', '0x-demo-a8', 'https://polymarket.com/profile/demo-a8', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A9', 'Wallet A9', '0x-demo-a9', 'https://polymarket.com/profile/demo-a9', null, 'active', '22222222-2222-2222-2222-222222222222'),
  ('A10', 'Wallet A10', '0x-demo-a10', 'https://polymarket.com/profile/demo-a10', 'Can rest more often if needed.', 'active', '22222222-2222-2222-2222-222222222222');
