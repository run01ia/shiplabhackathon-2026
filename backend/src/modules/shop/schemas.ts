import { z } from 'zod'

export const itemKeyParam = z.object({ key: z.string().regex(/^[a-z0-9_]+$/) })
export const equipBody = z.object({ equipped: z.boolean() })
