import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ServiceError } from '../services/errors'

// HTTPException はそのまま返し、想定外は 500 (詳細は返さない)
export const onError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  if (err instanceof ServiceError) {
    return c.json({ error: err.message }, err.kind === 'not_found' ? 404 : 400)
  }
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
}
