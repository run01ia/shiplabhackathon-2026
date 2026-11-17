-- レシートの読み取りに、全ユーザー合計の 1 日上限を足す (セキュリティチェック 中-1)。
-- ユーザーごとの上限 (1 日 5 回) だけだと、アカウントを量産すれば Claude API を何度でも呼べた。
-- 上限の値は backend が渡す (RECEIPT_DAILY_GLOBAL_LIMIT、既定 200)。

-- 全体の回数を数えるための index (これまでは user_id が先頭の index だけ)
create index receipt_scans_scanned_on_idx on public.receipt_scans (scanned_on);

-- 引数と戻り値が変わるので、古い関数は消す (残すと全体の上限なしで呼べてしまう)
drop function public.reserve_receipt_scan(uuid, uuid, date, integer);

-- 確保できたら { id, reason: null }。できなければ { id: null, reason: 'limit' | 'global_limit' }。
-- 日付ごとの advisory lock で全体を 1 つずつ処理し、同時に呼ばれても全体の上限を超えない
create function public.reserve_receipt_scan(
  p_user_id uuid, p_list_id uuid, p_today date, p_limit integer, p_global_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_today is null or p_limit is null or p_global_limit is null then
    raise exception 'invalid_limits';
  end if;

  -- トランザクションが終わると自動で外れる
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('receipt_scans:' || p_today::text, 0)
  );

  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if (select count(*) from public.receipt_scans
      where user_id = p_user_id and scanned_on = p_today) >= p_limit then
    return jsonb_build_object('id', null, 'reason', 'limit');
  end if;

  if (select count(*) from public.receipt_scans
      where scanned_on = p_today) >= p_global_limit then
    return jsonb_build_object('id', null, 'reason', 'global_limit');
  end if;

  insert into public.receipt_scans (user_id, list_id, scanned_on)
    values (p_user_id, p_list_id, p_today)
    returning id into v_id;
  return jsonb_build_object('id', v_id, 'reason', null);
end;
$$;

revoke execute on function public.reserve_receipt_scan(uuid, uuid, date, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_receipt_scan(uuid, uuid, date, integer, integer)
  to service_role;
