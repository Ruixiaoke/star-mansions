-- 二十八星宿 App — Supabase schema（PRD §8 / §9 / §15-a）
-- 在 Supabase 后台 SQL Editor 里粘贴执行一次即可（幂等，可重复跑）。
--
-- 说明：
--   - 后端用 service_role(secret) key 访问，绕过 RLS；前端只经 /api/*，不直连数据库。
--   - 邮箱为「软标识」（PRD §8：未验证所有权），记录按 user_id 作用域。
--   - 启用 RLS 且不加公开策略 → anon/publishable key 无法直接读写（仅后端 service key 可）。

create table if not exists public.users (
  id         text primary key,            -- = u_<email>
  email      text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.users(id) on delete cascade,
  input      jsonb not null,              -- BirthInput
  solar_date text  not null,
  benming    jsonb not null,              -- Benming
  created_at timestamptz not null default now()
);

create index if not exists readings_user_id_idx on public.readings (user_id);

-- 关闭对外直连：启用 RLS 但不建公开策略（service key 绕过 RLS，后端照常工作）
alter table public.users    enable row level security;
alter table public.readings enable row level security;
