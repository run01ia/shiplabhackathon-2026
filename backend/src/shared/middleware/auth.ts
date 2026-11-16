import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AuthUser, Env } from '../env'

type AuthDeps = {
  /** Bearer トークンを検証してユーザーを返す。無効なら null */
  verifyToken: (token: string) => Promise<AuthUser | null>
}

/** Authorization: Bearer <Supabase JWT> を検証し、c.var.user に入れる */
export const auth = (d: AuthDeps) =>
  createMiddleware<Env>(async (c, next) => {
    const token = c.req.header('Authorization')?.match(/^Bearer (.+)$/)?.[1]
    if (!token) throw new HTTPException(401, { message: 'unauthorized' })
    const user = await d.verifyToken(token)
    if (!user) throw new HTTPException(401, { message: 'invalid token' })
    c.set('user', user)
    await next()
  })
