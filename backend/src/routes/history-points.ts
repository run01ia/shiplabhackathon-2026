import { Hono } from 'hono'
import type { Deps } from '../deps'
import type { Env } from '../lib/env'
import { auth } from '../middleware/auth'
import { createHistoryService } from '../services/history'

export const historyPoints = (d: Deps) => {
  const svc = createHistoryService(d)
  return new Hono<Env>()
    .use('/history/*', auth(d))
    .get('/history/points', async (c) => c.json(await svc.points(c.var.user.id)))
}
