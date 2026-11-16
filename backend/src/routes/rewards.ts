import { Hono } from 'hono'
import type { Deps } from '../deps'
import type { Env } from '../lib/env'
import { auth } from '../middleware/auth'
import { createRewardsService } from '../services/rewards'

export const rewards = (d: Deps) => {
  const svc = createRewardsService(d)
  return new Hono<Env>()
    .use('/rewards/*', auth(d))
    .post('/rewards/login', async (c) => c.json(await svc.claimLogin(c.var.user.id)))
}
