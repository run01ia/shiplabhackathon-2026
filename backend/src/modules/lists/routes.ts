import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { uuidParams } from '../../shared/middleware/uuid-params'
import {
  addExtraItemSchema,
  addItemSchema,
  createListSchema,
  finishSchema,
  historyItemPatchSchema,
  purchaseSchema,
  updateItemSchema,
  updateListSchema,
} from './schemas'
import { createListUsecases } from './usecases'

// routes = controller (HTTP のアダプター)。ハンドラーは「入力を取り出す → use-case → 返す」だけ
export const lists = (d: Deps) => {
  const u = createListUsecases({ ...d.repos, clock: d.clock })
  return new Hono<Env>()
    .use('/lists/*', auth(d))
    .use('/history/*', auth(d))
    .use('/lists/:id', uuidParams)
    .use('/lists/:id/*', uuidParams)
    .use('/history/items/:itemId', uuidParams)
    .post('/lists', zValidator('json', createListSchema), async (c) =>
      c.json(await u.createList(c.var.user.id, c.req.valid('json').budget), 201),
    )
    .get('/lists/current', async (c) => c.json(await u.getCurrentList(c.var.user.id)))
    .patch('/lists/:id', zValidator('json', updateListSchema), async (c) =>
      c.json(await u.updateBudget(c.var.user.id, c.req.param('id'), c.req.valid('json').budget)),
    )
    .post('/lists/:id/items', zValidator('json', addItemSchema), async (c) =>
      c.json(await u.addItem(c.var.user.id, c.req.param('id'), c.req.valid('json').name), 201),
    )
    .patch('/lists/:id/items/:itemId', zValidator('json', updateItemSchema), async (c) =>
      c.json(
        await u.renameItem(
          c.var.user.id,
          c.req.param('id'),
          c.req.param('itemId'),
          c.req.valid('json').name,
        ),
      ),
    )
    .delete('/lists/:id/items/:itemId', async (c) => {
      await u.deleteItem(c.var.user.id, c.req.param('id'), c.req.param('itemId'))
      return c.body(null, 204)
    })
    .post('/lists/:id/start', async (c) =>
      c.json(await u.startShopping(c.var.user.id, c.req.param('id'))),
    )
    .patch('/lists/:id/items/:itemId/purchase', zValidator('json', purchaseSchema), async (c) =>
      c.json(
        await u.purchaseItem(
          c.var.user.id,
          c.req.param('id'),
          c.req.param('itemId'),
          c.req.valid('json').price,
        ),
      ),
    )
    .post('/lists/:id/extra-items', zValidator('json', addExtraItemSchema), async (c) =>
      c.json(await u.addExtraItem(c.var.user.id, c.req.param('id'), c.req.valid('json')), 201),
    )
    .post('/lists/:id/finish', zValidator('json', finishSchema), async (c) =>
      c.json(
        await u.finishShopping(c.var.user.id, c.req.param('id'), c.req.valid('json').spentAmount),
      ),
    )
    .get('/history/lists', async (c) => c.json({ lists: await u.listHistory(c.var.user.id) }))
    .patch('/history/items/:itemId', zValidator('json', historyItemPatchSchema), async (c) =>
      c.json(await u.fixHistoryItem(c.var.user.id, c.req.param('itemId'), c.req.valid('json'))),
    )
}
