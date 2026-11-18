import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Deps } from '../../deps'
import type { Env } from '../../shared/env'
import { auth } from '../../shared/middleware/auth'
import { uuidParams } from '../../shared/middleware/uuid-params'
import { addPantrySchema, matchPantrySchema, pantryStatusSchema } from './schemas'
import { createPantryUsecases } from './usecases'

// 家の在庫 (REQ-013)。書き込みはこの API だけが行う
export const pantry = (d: Deps) => {
  const u = createPantryUsecases({ pantry: d.repos.pantry, clock: d.clock })
  return new Hono<Env>()
    .use('/pantry', auth(d))
    .use('/pantry/*', auth(d))
    .use('/pantry/items/:id', uuidParams)
    .get('/pantry', async (c) => c.json(await u.listPantry(c.var.user.id)))
    .post('/pantry/items', zValidator('json', addPantrySchema), async (c) =>
      c.json(await u.addToPantry(c.var.user.id, c.req.valid('json').names), 201),
    )
    .post('/pantry/matches', zValidator('json', matchPantrySchema), async (c) =>
      c.json(await u.matchPantry(c.var.user.id, c.req.valid('json').names)),
    )
    .patch('/pantry/items/:id', zValidator('json', pantryStatusSchema), async (c) =>
      c.json(await u.setPantryStatus(c.var.user.id, c.req.param('id'), c.req.valid('json').status)),
    )
    .delete('/pantry/items/:id', async (c) => {
      await u.removeFromPantry(c.var.user.id, c.req.param('id'))
      return c.body(null, 204)
    })
}
