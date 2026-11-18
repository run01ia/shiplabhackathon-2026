import { Hono } from 'hono'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { createWalletUsecases } from './usecases'

export const wallet = (d: Deps) => {
  const u = createWalletUsecases({ wallets: d.repos.wallets, shop: d.repos.shop })
  return new Hono<Env>()
    .use('/history/*', auth(d))
    .get('/history/points', async (c) => c.json(await u.listPointLogs(c.var.user.id)))
}
