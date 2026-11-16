import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Deps } from '../deps'
import type { Env } from '../lib/env'
import { auth } from '../middleware/auth'
import { equipBody, itemKeyParam } from '../schemas/wallet'
import { createShopService } from '../services/shop'

export const shop = (d: Deps) => {
  const svc = createShopService(d)
  return new Hono<Env>()
    .use('/shop/*', auth(d))
    .get('/shop/items', async (c) => c.json(await svc.list(c.var.user.id)))
    .post('/shop/items/:key/buy', zValidator('param', itemKeyParam), async (c) =>
      c.json(await svc.buy(c.var.user.id, c.req.valid('param').key)),
    )
    .patch(
      '/shop/items/:key/equip',
      zValidator('param', itemKeyParam),
      zValidator('json', equipBody),
      async (c) =>
        c.json(
          await svc.equip(c.var.user.id, c.req.valid('param').key, c.req.valid('json').equipped),
        ),
    )
}
