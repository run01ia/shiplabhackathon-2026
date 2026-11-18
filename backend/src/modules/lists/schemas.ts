import { z } from 'zod'

const yen = z.number().int().min(0).max(10_000_000)
const name = z.string().trim().min(1).max(100)

export const createListSchema = z.object({ budget: yen.default(0) })
export const updateListSchema = z.object({ budget: yen })
export const addItemSchema = z.object({ name })
export const updateItemSchema = z.object({ name })
export const purchaseSchema = z.object({ price: yen })
export const addExtraItemSchema = z.object({
  name,
  price: yen,
  isUnnecessary: z.boolean().default(false),
})
// scanId = 判定に使うレシートの読み取り (POST /receipts/scan の応答)
export const finishSchema = z.object({ spentAmount: yen.optional(), scanId: z.uuid().optional() })
export const historyItemPatchSchema = z
  .object({ price: yen, isUnnecessary: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'empty patch')
