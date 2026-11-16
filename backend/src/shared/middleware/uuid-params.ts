import { createMiddleware } from 'hono/factory'
import { AppError } from '../errors'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** パスの :id / :itemId が uuid でなければ 404 (DB に渡して 500 にしないため) */
export const uuidParams = createMiddleware(async (c, next) => {
  for (const [key, value] of Object.entries(c.req.param() as Record<string, string>)) {
    if ((key === 'id' || key === 'itemId') && !UUID.test(value)) {
      throw new AppError('not_found', '見つかりません')
    }
  }
  await next()
})
