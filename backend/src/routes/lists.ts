import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Deps } from '../deps'
import type { Env } from '../lib/env'
import { auth } from '../middleware/auth'
import {
  addExtraItemSchema,
  addItemSchema,
  createListSchema,
  finishSchema,
  historyItemPatchSchema,
  purchaseSchema,
  updateItemSchema,
  updateListSchema,
} from '../schemas/lists'
import { createListService } from '../services/lists'

// ハンドラーは「入力を取り出す → service → 返す」だけ
export const lists = (d: Deps) => {
  const s = createListService({ lists: d.repos.lists, wallets: d.repos.wallets, clock: d.clock })
  return new Hono<Env>()
    .use('/lists/*', auth(d))
    .use('/history/*', auth(d))
    .post('/lists', zValidator('json', createListSchema), async (c) =>
      c.json(await s.create(c.var.user.id, c.req.valid('json').budget), 201),
    )
    .get('/lists/current', async (c) => c.json(await s.current(c.var.user.id)))
    .patch('/lists/:id', zValidator('json', updateListSchema), async (c) =>
      c.json(await s.updateBudget(c.var.user.id, c.req.param('id'), c.req.valid('json').budget)),
    )
    .post('/lists/:id/items', zValidator('json', addItemSchema), async (c) =>
      c.json(await s.addItem(c.var.user.id, c.req.param('id'), c.req.valid('json').name), 201),
    )
    .patch('/lists/:id/items/:itemId', zValidator('json', updateItemSchema), async (c) =>
      c.json(
        await s.renameItem(
          c.var.user.id,
          c.req.param('id'),
          c.req.param('itemId'),
          c.req.valid('json').name,
        ),
      ),
    )
    .delete('/lists/:id/items/:itemId', async (c) => {
      await s.deleteItem(c.var.user.id, c.req.param('id'), c.req.param('itemId'))
      return c.body(null, 204)
    })
    .post('/lists/:id/start', async (c) => c.json(await s.start(c.var.user.id, c.req.param('id'))))
    .patch('/lists/:id/items/:itemId/purchase', zValidator('json', purchaseSchema), async (c) =>
      c.json(
        await s.purchase(
          c.var.user.id,
          c.req.param('id'),
          c.req.param('itemId'),
          c.req.valid('json').price,
        ),
      ),
    )
    .post('/lists/:id/extra-items', zValidator('json', addExtraItemSchema), async (c) =>
      c.json(await s.addExtra(c.var.user.id, c.req.param('id'), c.req.valid('json')), 201),
    )
    .post('/lists/:id/finish', zValidator('json', finishSchema), async (c) =>
      c.json(await s.finish(c.var.user.id, c.req.param('id'), c.req.valid('json').spentAmount)),
    )
    .get('/history/lists', async (c) => c.json({ lists: await s.history(c.var.user.id) }))
    .patch('/history/items/:itemId', zValidator('json', historyItemPatchSchema), async (c) =>
      c.json(await s.fixHistoryItem(c.var.user.id, c.req.param('itemId'), c.req.valid('json'))),
    )
}
