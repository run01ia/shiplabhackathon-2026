-- add_points の配列引数の検査を足す (セキュリティチェック 低-1)。
-- NULL 要素があると coins が NULL → 0 になり、多次元配列は長さ (cardinality) の検査をすり抜けた。
-- level には上限 99 (backend の MAX_LEVEL と同じ) を置く。引数は同じなので、実行権限 (service_role だけ) はそのまま。

alter table public.profiles
  add constraint profiles_level_max_check check (level <= 99);

create or replace function public.add_points(
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
  -- 1 次元の配列だけ (空の配列は array_ndims が NULL)。array_position は多次元だとエラーになるので、先に弾く
  if coalesce(array_ndims(p_deltas), 1) > 1
     or coalesce(array_ndims(p_reasons), 1) > 1
     or coalesce(array_ndims(p_exp_gains), 1) > 1
     or coalesce(array_ndims(p_thresholds), 1) > 1 then
    raise exception 'invalid_grants';
  end if;
  -- NULL の要素は受け付けない
  if array_position(p_deltas, null) is not null
     or array_position(p_reasons, null) is not null
     or array_position(p_exp_gains, null) is not null
     or array_position(p_thresholds, null) is not null then
    raise exception 'invalid_grants';
  end if;
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
        -- しきい値を超えた数 + 1 がレベル (上限 99)。育ったペットは縮まない (下げない)
        level = greatest(
          level,
          least(
            1 + (select count(*)::integer
                 from unnest(coalesce(p_thresholds, '{}'::integer[])) as t (total)
                 where t.total <= v_exp),
            99
          )
        )
    where id = p_user_id returning * into v_profile;

  -- 履歴は渡された順に並ぶよう、created_at を 1 マイクロ秒ずつずらす
  insert into public.point_logs (user_id, delta, reason, created_at)
  select p_user_id, g.delta, g.reason, now() + (g.ord - 1) * interval '1 microsecond'
  from unnest(p_deltas, p_reasons) with ordinality as g (delta, reason, ord);

  return to_jsonb(v_profile) || jsonb_build_object('previous_level', v_previous_level);
end;
$$;

-- create or replace は権限を引き継ぐが、念のため明示する
revoke execute on function public.add_points(uuid, integer[], text[], integer[], integer[])
  from public, anon, authenticated;
grant execute on function public.add_points(uuid, integer[], text[], integer[], integer[])
  to service_role;
