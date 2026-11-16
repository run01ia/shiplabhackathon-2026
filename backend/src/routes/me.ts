import { Hono } from 'hono'
import type { Deps } from '../deps'
import type { Env } from '../lib/env'
import { auth } from '../middleware/auth'
import { createMeService } from '../services/me'

export const me = (d: Deps) => {
  const svc = createMeService(d)
  return new Hono<Env>()
    .use('/me', auth(d))
    .get('/me', async (c) => c.json(await svc.get(c.var.user.id)))
}
