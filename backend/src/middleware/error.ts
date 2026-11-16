import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AppError, type AppErrorKind } from '../services/errors'

const STATUS = { not_found: 404, conflict: 409, bad_request: 400 } as const satisfies Record<
  AppErrorKind,
  number
>

// HTTPException と AppError (service のエラー) はそのまま返し、想定外は 500 (詳細は返さない)
export const onError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  if (err instanceof AppError) {
    return c.json({ error: err.message }, STATUS[err.kind])
  }
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
}
