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

-- 卦例（六爻 PRD §11/§12）—— 纯增量表，不动上面 users / readings 两张表的任何一列。
-- readings 的 benming / solar_date 是二十八宿专用硬列，塞不进卦象，故另起一表。
create table if not exists public.divinations (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.users(id) on delete cascade,
  kind       text not null,               -- 本期恒为 'liuyao'（预留：将来别的玩法复用本表）
  topic      text not null,               -- 所问事项（下拉框枚举值，非自由文本；PRD §14 隐私设计）
  code       text not null,               -- 卦码，六个爻数，如 '987678'
  payload    jsonb not null,              -- 卦的完整快照
  created_at timestamptz not null default now()
);

create index if not exists divinations_user_id_idx on public.divinations (user_id);

alter table public.divinations enable row level security;
