-- レシートの AI 判定 (Issue #93, REQ-012)。読み取りの回数と結果を記録する。
-- 画像は保存しない (読み取った品目だけ)。読み書きは API (service_role) のみで、クライアントには何も許さない。

create table public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid references public.lists (id) on delete set null,
  scanned_on date not null,                    -- 読んだ日 (JST)。1 日の回数制限に使う
  items jsonb,                                 -- 読み取った品目 [{ name, price, category }]。失敗なら null
  total integer,                               -- レシートの合計 (円)
  bonus integer not null default 0,            -- 付与したポイント
  rewarded boolean not null default false,     -- この読み取りで今日のボーナスを受け取った
  created_at timestamptz not null default now()
);
create index receipt_scans_user_id_scanned_on_idx
  on public.receipt_scans (user_id, scanned_on);
-- ボーナスは 1 日 1 回 (同時に呼ばれても、2 つ目の更新は unique 違反になる)
create unique index receipt_scans_one_reward_per_day
  on public.receipt_scans (user_id, scanned_on) where rewarded;
create index receipt_scans_list_id_idx on public.receipt_scans (list_id);

-- RLS を有効にし、policy は作らない (anon / authenticated は読めない・書けない)
alter table public.receipt_scans enable row level security;
revoke all on public.receipt_scans from anon, authenticated;

-- 今日の回数が上限未満なら 1 行足して id を返す。上限なら null。
-- profiles の行をロックして、同じユーザーの同時の呼び出しを 1 つずつ処理する (上限を超えない)
create function public.reserve_receipt_scan(
  p_user_id uuid, p_list_id uuid, p_today date, p_limit integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if (select count(*) from public.receipt_scans
      where user_id = p_user_id and scanned_on = p_today) >= p_limit then
    return null;
  end if;

  insert into public.receipt_scans (user_id, list_id, scanned_on)
    values (p_user_id, p_list_id, p_today)
    returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.reserve_receipt_scan(uuid, uuid, date, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_receipt_scan(uuid, uuid, date, integer) to service_role;
