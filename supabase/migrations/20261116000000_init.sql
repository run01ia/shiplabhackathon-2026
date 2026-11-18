-- お買い物上手 初期スキーマ (Issue #7)
-- 方針: 通貨・スコア・レベルなどゲーム状態の変更は API (service_role) のみ。
--       クライアント (authenticated) には列単位の GRANT + RLS で必要最小限だけ許可する。

-- ============================================================
-- profiles: auth.users と 1:1。ペット・スコア・通貨 (現在残高のみ)・報酬の日次判定
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pet_name text not null default 'ぷち' check (char_length(pet_name) between 1 and 20),
  score integer not null default 0,                      -- 買い物上手スコア (REQ-006)
  coins integer not null default 0 check (coins >= 0),   -- ゲーム内通貨の現在残高 (REQ-006)
  level integer not null default 1 check (level >= 1),   -- ペットのレベル (REQ-007)
  exp integer not null default 0 check (exp >= 0),       -- 経験値 (REQ-007)
  last_login_reward_on date,                             -- ログインボーナス付与日 (1 日 1 回)
  last_list_reward_on date,                              -- リスト作成・閲覧ポイント付与日 (1 日 1 回)
  last_shopping_judged_on date,                          -- 「買い物に行かなかった日」判定済みの日
  created_at timestamptz not null default now()
);

-- 新規ユーザー登録時に profiles 行を自動作成 (クライアントには insert させない)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- lists: 買い物リスト。「今のリスト 1 つ」中心 (状態: 作成中 / 買い物中 / 完了)
-- ============================================================
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  budget integer not null default 0 check (budget >= 0),          -- 予算 (円, REQ-003)
  status text not null default 'planning'
    check (status in ('planning', 'shopping', 'finished')),
  spent_amount integer check (spent_amount >= 0),                 -- 実際の支出 (円, REQ-005)
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index lists_user_id_idx on public.lists (user_id);
-- 進行中 (finished 以外) のリストは 1 ユーザー 1 つ
create unique index lists_one_active_per_user_idx
  on public.lists (user_id) where status <> 'finished';

-- ============================================================
-- list_items: リストの品目
-- ============================================================
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  price integer not null default 0 check (price >= 0),            -- 円 (REQ-003)
  is_checked boolean not null default false,                      -- 購入済み (REQ-002)
  is_extra boolean not null default false,                        -- リスト外購入 (REQ-004)
  is_unnecessary boolean not null default false,                  -- 不要購入 (REQ-004)
  created_at timestamptz not null default now()
);
create index list_items_list_id_idx on public.list_items (list_id);

-- ============================================================
-- items: 着せ替えマスタ / user_items: 所持と装備
-- ============================================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  name text not null,
  price integer not null check (price >= 0)
);

create table public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  equipped boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);
create index user_items_item_id_idx on public.user_items (item_id);

-- ============================================================
-- stores: 登録スーパー (緯度経度のみ。現在地は保存しない, REQ-009)
-- ============================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz not null default now()
);
create index stores_user_id_idx on public.stores (user_id);

-- ============================================================
-- RLS 有効化
-- ============================================================
alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.items enable row level security;
alter table public.user_items enable row level security;
alter table public.stores enable row level security;

-- ============================================================
-- 権限: 既定の全権限を外し、必要な操作・列だけ authenticated に付与
-- (service_role は RLS をバイパスし API から全操作できる)
-- ============================================================
revoke all on public.profiles, public.lists, public.list_items,
  public.items, public.user_items, public.stores from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (pet_name) on public.profiles to authenticated;      -- ペット名のみ変更可

grant select, delete on public.lists to authenticated;
grant insert (user_id, budget) on public.lists to authenticated;  -- status / spent_amount は API
grant update (budget) on public.lists to authenticated;

grant select, insert, delete on public.list_items to authenticated;
grant update (name, price, is_checked, is_extra, is_unnecessary) on public.list_items to authenticated;

grant select on public.items to authenticated;

grant select on public.user_items to authenticated;               -- 購入 (insert) は API
grant update (equipped) on public.user_items to authenticated;

grant select, insert, delete on public.stores to authenticated;
grant update (name, lat, lng) on public.stores to authenticated;

-- ============================================================
-- RLS ポリシー (auth.uid() は select で包んで 1 回評価にする)
-- ============================================================
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy lists_select_own on public.lists
  for select to authenticated using (user_id = (select auth.uid()));
create policy lists_insert_own on public.lists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy lists_update_own on public.lists
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy lists_delete_own on public.lists
  for delete to authenticated using (user_id = (select auth.uid()));

create policy list_items_select_own on public.list_items
  for select to authenticated
  using (exists (select 1 from public.lists l
                 where l.id = list_id and l.user_id = (select auth.uid())));
create policy list_items_insert_own on public.list_items
  for insert to authenticated
  with check (exists (select 1 from public.lists l
                      where l.id = list_id and l.user_id = (select auth.uid())));
create policy list_items_update_own on public.list_items
  for update to authenticated
  using (exists (select 1 from public.lists l
                 where l.id = list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.lists l
                      where l.id = list_id and l.user_id = (select auth.uid())));
create policy list_items_delete_own on public.list_items
  for delete to authenticated
  using (exists (select 1 from public.lists l
                 where l.id = list_id and l.user_id = (select auth.uid())));

create policy items_select_all on public.items
  for select to authenticated using (true);

create policy user_items_select_own on public.user_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_items_update_own on public.user_items
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy stores_select_own on public.stores
  for select to authenticated using (user_id = (select auth.uid()));
create policy stores_insert_own on public.stores
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy stores_update_own on public.stores
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy stores_delete_own on public.stores
  for delete to authenticated using (user_id = (select auth.uid()));

-- ============================================================
-- 初期データ: 着せ替えマスタ (REQ-008)
-- ============================================================
insert into public.items (key, name, price) values
  ('hat', 'ぼうし', 30),
  ('ribbon', 'リボン', 40),
  ('crown', 'おうかん', 200),
  ('glasses', 'めがね', 60);
