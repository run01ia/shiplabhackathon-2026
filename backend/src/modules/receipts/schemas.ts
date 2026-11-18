import { z } from 'zod'
import { CATEGORIES } from './domain/category'
import { MAX_IMAGE_BYTES } from './domain/image'
import type { Reading } from './repository'

/** multipart の枠のぶんだけ、画像の上限より少し大きくする (bodyLimit 用) */
export const MAX_UPLOAD_BYTES = MAX_IMAGE_BYTES + 64 * 1024

/** POST /receipts/scan (multipart/form-data) */
export const scanForm = z.object({
  image: z
    .instanceof(File, { message: '画像を選んでください' })
    .refine((f) => f.size > 0 && f.size <= MAX_IMAGE_BYTES, '画像は 5MB までです'),
  listId: z.uuid(),
})

// AI が返した JSON の検証。構造は output_config.format で縛ってあるが、値の範囲はここで確かめる
const readingSchema = z.object({
  isReceipt: z.boolean(),
  items: z
    .array(
      z.object({
        // 画面に出すだけの文字列。長すぎる名前は切る
        name: z
          .string()
          .trim()
          .min(1)
          .transform((s) => s.slice(0, 60)),
        price: z.number().int().min(-1_000_000).max(1_000_000),
        category: z.enum(CATEGORIES),
        onList: z.boolean(),
      }),
    )
    .max(100),
  total: z.number().int().min(0).max(10_000_000).nullable(),
})

/** 検証に通らなければ null */
export const parseReading = (raw: unknown): Reading | null => {
  const r = readingSchema.safeParse(raw)
  return r.success ? r.data : null
}
