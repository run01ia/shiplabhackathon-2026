-- 家の在庫 (Issue #99, REQ-013)。品目名と「ある / 少ない」だけを持つ (数量は管理しない)。
-- 書き込みは API (service_role) だけ (lists / list_items と同じ方針)。本人は読むだけ。

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- 比較用のキー (API が全角半角・空白・カタカナひらがなを揃えた名前)。同じ品目は 1 人 1 行
  name_key text not null check (char_length(name_key) between 1 and 200),
  status text not null default 'have' check (status in ('have', 'low')),
  stocked_at timestamptz not null default now(),   -- 最後に在庫に入れた日時
  created_at timestamptz not null default now(),
  -- user_id で始まる index になるので、本人の一覧の取得にも使える
  unique (user_id, name_key)
);

alter table public.pantry_items enable row level security;

-- 列の権限: 本人が読めるのは表示に使う列だけ。insert / update / delete は許さない
revoke all on public.pantry_items from anon, authenticated;
grant select (id, user_id, name, status, stocked_at) on public.pantry_items to authenticated;

create policy pantry_items_select_own on public.pantry_items
  for select to authenticated using ((select auth.uid()) = user_id);
