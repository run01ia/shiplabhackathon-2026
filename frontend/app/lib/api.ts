// type-only: backend の実行時コードは front に取り込まない (型だけ共有する Hono RPC)
import type { AppType } from '@backend/app'
import { hc } from 'hono/client'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** アクセストークンを Authorization: Bearer で付ける型付きクライアント */
export const createApi = (accessToken: string) =>
  hc<AppType>(baseUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
