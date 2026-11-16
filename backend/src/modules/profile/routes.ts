import { Hono } from 'hono'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { createProfileUsecases } from './usecases'

export const profile = (d: Deps) => {
  const u = createProfileUsecases({ ...d.repos, clock: d.clock })
  return new Hono<Env>()
    .use('/me', auth(d))
    .get('/me', async (c) => c.json(await u.getMe(c.var.user.id)))
    .use('/rewards/*', auth(d))
    .post('/rewards/login', async (c) => c.json(await u.claimLoginReward(c.var.user.id)))
}
