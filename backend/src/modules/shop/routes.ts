import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { equipBody, itemKeyParam } from './schemas'
import { createShopUsecases } from './usecases'

export const shop = (d: Deps) => {
  const u = createShopUsecases({ shop: d.repos.shop })
  return new Hono<Env>()
    .use('/shop/*', auth(d))
    .get('/shop/items', async (c) => c.json(await u.listShopItems(c.var.user.id)))
    .post('/shop/items/:key/buy', zValidator('param', itemKeyParam), async (c) =>
      c.json(await u.buyItem(c.var.user.id, c.req.valid('param').key)),
    )
    .patch(
      '/shop/items/:key/equip',
      zValidator('param', itemKeyParam),
      zValidator('json', equipBody),
      async (c) =>
        c.json(
          await u.equipItem(c.var.user.id, c.req.valid('param').key, c.req.valid('json').equipped),
        ),
    )
}
