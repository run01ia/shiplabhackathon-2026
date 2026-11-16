-- 履歴テーブルと品目金額 null 可 (Issue #18, REQ-006 / REQ-014)

-- ============================================================
-- point_logs: ポイント増減の履歴 (REQ-006 / REQ-014)
-- 追加は API (service_role) のみ。クライアントは自分の行を読むだけ。
-- ============================================================
create table public.point_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,                       -- 増減 (プラス / マイナス)
  reason text not null,                         -- 理由 (例: ログインボーナス, 予算超過)
  created_at timestamptz not null default now()
);
create index point_logs_user_id_created_at_idx
  on public.point_logs (user_id, created_at desc);

alter table public.point_logs enable row level security;
revoke all on public.point_logs from anon, authenticated;
grant select on public.point_logs to authenticated;

create policy point_logs_select_own on public.point_logs
  for select to authenticated using (user_id = (select auth.uid()));

-- ============================================================
-- list_items.price を null 可にする (購入時に入れるため。null = 未入力)
-- price >= 0 の check は null を許すのでそのまま維持される。
-- ============================================================
alter table public.list_items alter column price drop not null;
alter table public.list_items alter column price drop default;

-- ============================================================
-- 完了後 (lists.status = 'finished') のリストの品目は、
-- price と is_unnecessary だけ本人が修正できる (REQ-014 の手動修正)。
-- 列単位の GRANT は行の状態を見られないため、トリガーで他の列の変更を拒否する。
-- (auth.uid() が null = service_role など API 経由は対象外)
-- ============================================================
create function public.list_items_guard_finished()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and exists (select 1 from public.lists l
                 where l.id = old.list_id and l.status = 'finished')
     and (new.id, new.list_id, new.name, new.is_checked, new.is_extra, new.created_at)
         is distinct from
         (old.id, old.list_id, old.name, old.is_checked, old.is_extra, old.created_at)
  then
    raise exception '完了したリストの品目は price と is_unnecessary のみ更新できます'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger list_items_guard_finished
  before update on public.list_items
  for each row execute function public.list_items_guard_finished();
