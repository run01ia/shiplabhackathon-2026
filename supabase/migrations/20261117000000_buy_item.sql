-- 購入 (コイン減算 + 所持追加) とポイント加算 (profiles + point_logs) を 1 トランザクションにする (Issue #33)
-- supabase-js にはトランザクションがないため rpc にする。API (secret キー = service_role) だけが呼べる。

create function public.buy_item(p_user_id uuid, p_item_key text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items;
  v_profile public.profiles;
begin
  select * into v_item from public.items where key = p_item_key;
  if not found then
    raise exception 'item_not_found';
  end if;

  -- 同時購入で残高が負にならないよう、行をロックしてから判定する
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if exists (select 1 from public.user_items
             where user_id = p_user_id and item_id = v_item.id) then
    raise exception 'already_owned';
  end if;
  if v_profile.coins < v_item.price then
    raise exception 'insufficient_coins';
  end if;

  update public.profiles set coins = coins - v_item.price
    where id = p_user_id returning * into v_profile;
  insert into public.user_items (user_id, item_id) values (p_user_id, v_item.id);
  return v_profile;
end;
$$;

-- coins と score を delta だけ増減し、point_logs に 1 行追加する。coins は 0 未満にしない
create function public.add_points(p_user_id uuid, p_delta integer, p_reason text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  update public.profiles
    set coins = greatest(coins + p_delta, 0), score = score + p_delta
    where id = p_user_id returning * into v_profile;
  if not found then
    raise exception 'profile_not_found';
  end if;
  insert into public.point_logs (user_id, delta, reason) values (p_user_id, p_delta, p_reason);
  return v_profile;
end;
$$;

revoke execute on function public.buy_item(uuid, text) from public, anon, authenticated;
revoke execute on function public.add_points(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.buy_item(uuid, text) to service_role;
grant execute on function public.add_points(uuid, integer, text) to service_role;
