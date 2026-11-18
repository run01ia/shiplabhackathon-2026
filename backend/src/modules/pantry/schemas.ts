import { z } from 'zod'

const name = z.string().trim().min(1).max(100)

// 追加は 1 回 50 個まで (買い物 1 回ぶんを想定)
export const addPantrySchema = z.object({ names: z.array(name).min(1).max(50) })
export const matchPantrySchema = z.object({ names: z.array(name).max(100) })
export const pantryStatusSchema = z.object({ status: z.enum(['have', 'low']) })
