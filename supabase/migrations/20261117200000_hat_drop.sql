-- おみやげ (帽子のドロップ, Issue #84)。予算内クリアで、レア度つきの帽子が 1 つ手に入る。
-- 抽選は API (backend/src/modules/shop/domain/drop.ts)。ここは「どの帽子が出るか」と付与だけを持つ。

-- rarity: null = ショップで買うアイテム。値あり = おみやげ限定 (買えない)
alter table public.items
  add column rarity text check (rarity in ('common', 'rare', 'epic'));

insert into public.items (key, name, price, rarity) values
  ('straw', 'むぎわらぼうし', 0, 'common'),
  ('beanie', 'ニットぼう', 0, 'common'),
  ('chef', 'コックぼう', 0, 'rare'),
  ('wizard', 'まほうのぼうし', 0, 'epic');

-- おみやげ限定のアイテムは買えないようにする (price 0 のまま買えてしまうのを防ぐ)。他は元のまま
create or replace function public.buy_item(p_user_id uuid, p_item_key text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items;
  v_profile public.profiles;
begin
  select * into v_item from public.items where key = p_item_key and rarity is null;
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

-- おみやげを付与する。帽子を足せたら 'item'、足せなければ (key なし / 所持済み) コインに換えて 'coins'。
-- 二重付与は user_items の unique (user_id, item_id) で防ぐ。
-- コインは coins だけ増やす (score は買い物の成績なので変えない)
create function public.grant_drop(p_user_id uuid, p_item_key text, p_coins integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item_id uuid;
  v_inserted integer := 0;
begin
  if p_coins < 0 or p_coins > 100 then
    raise exception 'invalid_coins';
  end if;

  if p_item_key is not null then
    select id into v_item_id from public.items where key = p_item_key and rarity is not null;
    if not found then
      raise exception 'item_not_found';
    end if;
    insert into public.user_items (user_id, item_id) values (p_user_id, v_item_id)
      on conflict (user_id, item_id) do nothing;
    get diagnostics v_inserted = row_count;
    if v_inserted > 0 then
      return 'item';
    end if;
  end if;

  update public.profiles set coins = coins + p_coins where id = p_user_id;
  if not found then
    raise exception 'profile_not_found';
  end if;
  insert into public.point_logs (user_id, delta, reason) values (p_user_id, p_coins, 'おみやげ');
  return 'coins';
end;
$$;

revoke execute on function public.grant_drop(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.grant_drop(uuid, text, integer) to service_role;
