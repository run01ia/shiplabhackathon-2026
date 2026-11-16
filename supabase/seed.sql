-- ローカル専用のデモデータ (`supabase db reset` で入る。本番には入らない)。
-- デモ用ユーザー: demo@example.test / demo-pass-1234 (テスト用の値)。
-- ログイン報酬は未受け取りにしてあるので、ログインするとホームで報酬の演出が出る。

do $$
declare
  uid constant uuid := '00000000-0000-4000-8000-00000000d3e0';
  l1 uuid := gen_random_uuid();
  l2 uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'demo@example.test', extensions.crypt('demo-pass-1234', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now() - interval '3 days', now(),
    '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', 'demo@example.test'), 'email', now(), now(), now());

  -- profiles はトリガーで作られる。過去 2 回の買い物の結果を反映した状態にする
  update public.profiles set coins = 90, score = 120 where id = uid;

  -- 2 日前: 予算内・リスト通り
  insert into public.lists (id, user_id, budget, status, spent_amount, created_at, finished_at)
  values (l1, uid, 1500, 'finished', 1280, now() - interval '2 days', now() - interval '2 days' + interval '40 minutes');
  insert into public.list_items (list_id, name, price, is_checked) values
    (l1, '牛乳', 230, true), (l1, '卵', 280, true), (l1, '食パン', 170, true), (l1, '鶏むね肉', 600, true);

  -- 昨日: 予算超過 + 不要買い
  insert into public.lists (id, user_id, budget, status, spent_amount, created_at, finished_at)
  values (l2, uid, 1000, 'finished', 1350, now() - interval '1 day', now() - interval '1 day' + interval '30 minutes');
  insert into public.list_items (list_id, name, price, is_checked, is_extra, is_unnecessary) values
    (l2, 'にんじん', 150, true, false, false), (l2, '豆腐', 100, true, false, false),
    (l2, 'カップ麺 (セール)', 600, true, true, true), (l2, 'ポテトチップス', 500, true, true, true);

  insert into public.point_logs (user_id, delta, reason, created_at) values
    (uid, 20, 'ログインボーナス', now() - interval '2 days' - interval '1 hour'),
    (uid, 30, '予算内', now() - interval '2 days' + interval '40 minutes'),
    (uid, 10, 'リスト通り', now() - interval '2 days' + interval '40 minutes'),
    (uid, 5, '不要買いをやめた', now() - interval '2 days' + interval '40 minutes'),
    (uid, 20, 'ログインボーナス', now() - interval '1 day' - interval '1 hour'),
    (uid, -20, '予算超過', now() - interval '1 day' + interval '30 minutes'),
    (uid, -30, '不要買い ×2', now() - interval '1 day' + interval '30 minutes'),
    (uid, 30, '買い物に行かなかった日', now() - interval '1 day' - interval '1 hour');

  -- ぼうしを持っていて、着ている
  insert into public.user_items (user_id, item_id, equipped)
  select uid, id, true from public.items where key = 'hat';
end $$;
