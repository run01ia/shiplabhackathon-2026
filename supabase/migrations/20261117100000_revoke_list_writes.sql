-- lists と list_items の書き込みは API (service_role) だけにする。
-- クライアントが PostgREST で直接書くと、API の状態チェック (買い物中だけ品目を足せる、など) を通らないため。
-- 読み取り (select) と RLS はそのまま。
revoke insert, update, delete on public.lists from authenticated;
revoke insert, update, delete on public.list_items from authenticated;
