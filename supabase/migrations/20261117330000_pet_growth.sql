-- ペットが育つ (Issue #92, REQ-007)。ポイントの付与と一緒に、経験値とレベルを 1 トランザクションで更新する。
-- profiles.exp は累計の経験値 (プラスのポイントで増える。減らない)、profiles.level はそこから決まる値。
--
-- レベルの規則 (しきい値の式、何が経験値になるか) は backend の domain (modules/wallet/domain/level.ts) だけが持つ。
-- SQL には式を書かず、API が配列で渡す:
--   p_exp_gains  = 付与ごとの経験値 (p_deltas と同じ長さ)
--   p_thresholds = レベル 2, 3, ... に届く累計の経験値
-- 複数の付与 (買い物の内訳、ログイン報酬 + 行かなかった日) も 1 回で反映する (途中で失敗して半分だけ付くことがない)。

drop function public.add_points(uuid, integer, text);

create function public.add_points(
  p_user_id uuid,
  p_deltas integer[],
  p_reasons text[],
  p_exp_gains integer[],
  p_thresholds integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_previous_level integer;
  v_coins integer;
  v_score integer;
  v_exp integer;
  v_count integer := coalesce(cardinality(p_deltas), 0);
begin
  if coalesce(cardinality(p_reasons), 0) <> v_count
     or coalesce(cardinality(p_exp_gains), 0) <> v_count then
    raise exception 'invalid_grants';
  end if;

  -- 同時の付与で読み書きがずれないよう、行をロックしてから計算する
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found';
  end if;
  v_previous_level := v_profile.level;
  v_coins := v_profile.coins;
  v_score := v_profile.score;
  v_exp := v_profile.exp;

  -- 付与を順に適用する。coins は 1 件ごとに 0 未満にしない。経験値は減らさない
  for i in 1..v_count loop
    v_coins := greatest(v_coins + p_deltas[i], 0);
    v_score := v_score + p_deltas[i];
    v_exp := v_exp + greatest(p_exp_gains[i], 0);
  end loop;

  update public.profiles
    set coins = v_coins,
        score = v_score,
        exp = v_exp,
        -- しきい値を超えた数 + 1 がレベル。育ったペットは縮まない (下げない)
        level = greatest(
          level,
          1 + (select count(*)::integer
               from unnest(coalesce(p_thresholds, '{}'::integer[])) as t (total)
               where t.total <= v_exp)
        )
    where id = p_user_id returning * into v_profile;

  -- 履歴は渡された順に並ぶよう、created_at を 1 マイクロ秒ずつずらす
  insert into public.point_logs (user_id, delta, reason, created_at)
  select p_user_id, g.delta, g.reason, now() + (g.ord - 1) * interval '1 microsecond'
  from unnest(p_deltas, p_reasons) with ordinality as g (delta, reason, ord);

  return to_jsonb(v_profile) || jsonb_build_object('previous_level', v_previous_level);
end;
$$;

revoke execute on function public.add_points(uuid, integer[], text[], integer[], integer[])
  from public, anon, authenticated;
grant execute on function public.add_points(uuid, integer[], text[], integer[], integer[])
  to service_role;
