import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

// HTTPException はそのまま返し、想定外は 500 (詳細は返さない)
export const onError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
}
