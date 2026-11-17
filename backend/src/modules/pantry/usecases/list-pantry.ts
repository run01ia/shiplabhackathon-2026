import type { PantryItem, PantryRepo } from '../repository'

/** 応答の形 (比較用のキーは外に出さない) */
export const toView = ({ id, name, status, stockedAt }: PantryItem) => ({
  id,
  name,
  status,
  stockedAt,
})

/** 家にあるもの (新しい順) */
export const listPantry = (d: { pantry: Pick<PantryRepo, 'list'> }) => async (userId: string) => ({
  items: (await d.pantry.list(userId)).map(toView),
})
