// 行 (snake_case) ↔ 型 (camelCase) の変換だけ。ビジネス判定はしない
import type { Row } from '../../../shared/supabase'
import type { List, ListItem, ListStatus } from '../repository'

export const LIST_COLS = 'id, user_id, budget, status, spent_amount, created_at, finished_at'
export const ITEM_COLS = 'id, list_id, name, price, is_checked, is_extra, is_unnecessary'

export const toList = (r: Row): List => ({
  id: r.id as string,
  userId: r.user_id as string,
  budget: r.budget as number,
  status: r.status as ListStatus,
  spentAmount: r.spent_amount as number | null,
  createdAt: r.created_at as string,
  finishedAt: r.finished_at as string | null,
})

export const toItem = (r: Row): ListItem => ({
  id: r.id as string,
  listId: r.list_id as string,
  name: r.name as string,
  price: r.price as number | null,
  isChecked: r.is_checked as boolean,
  isExtra: r.is_extra as boolean,
  isUnnecessary: r.is_unnecessary as boolean,
})
