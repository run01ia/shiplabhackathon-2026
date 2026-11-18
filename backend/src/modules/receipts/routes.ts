import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { MAX_UPLOAD_BYTES, parseReading, scanForm } from './schemas'
import { createReceiptUsecases, type ScanFailure } from './usecases'

// 失敗の理由 → HTTP。文言は画面にそのまま出す (内部の情報は入れない)
const FAILURES = {
  disabled: [404, 'レシートの読み取りは、いま使えません'],
  too_large: [413, '画像が大きすぎます (5MB まで)'],
  bad_image: [400, 'JPEG / PNG / WebP の画像を選んでください'],
  limit: [429, '今日はもう読めないよ。また明日ね'],
  crowded: [429, '今日は混み合っています。また明日ためしてね'],
  busy: [503, 'いま混み合っているみたい。少し待ってからもう一度ためしてね'],
  unavailable: [503, 'うまく読めなかった…。少し待ってからもう一度ためしてね'],
  unreadable: [422, 'うまく読めなかった…。明るいところで、もう一度とってみてね'],
  not_receipt: [422, 'レシートが見つからなかったよ。レシート全体がうつるようにとってね'],
} as const satisfies Record<ScanFailure, readonly [number, string]>

export const receipts = (d: Deps) => {
  const u = createReceiptUsecases({ ...d.repos, clock: d.clock, parseReading })
  return new Hono<Env>()
    .use('/receipts/*', auth(d))
    .get('/receipts/status', async (c) => c.json(await u.getReceiptStatus(c.var.user.id)))
    .post(
      '/receipts/scan',
      // 本文を読む前に大きさで止める (認証のあと)
      bodyLimit({
        maxSize: MAX_UPLOAD_BYTES,
        onError: () => {
          throw new HTTPException(413, { message: FAILURES.too_large[1] })
        },
      }),
      zValidator('form', scanForm),
      async (c) => {
        const { image, listId } = c.req.valid('form')
        const bytes = new Uint8Array(await image.arrayBuffer())
        const r = await u.scanReceipt(c.var.user.id, listId, bytes)
        if (r.ok) return c.json(r.result)
        const [status, message] = FAILURES[r.reason]
        throw new HTTPException(status, { message })
      },
    )
}
