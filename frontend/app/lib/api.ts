// type-only: backend の実行時コードは front に取り込まない (型だけ共有する Hono RPC)
import type { AppType } from '@backend/app'
import { hc } from 'hono/client'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** アクセストークンを Authorization: Bearer で付ける型付きクライアント */
export const createApi = (accessToken: string) =>
  hc<AppType>(baseUrl, { headers: { Authorization: `Bearer ${accessToken}` } })

/** 応答を検査し、`!res.ok` なら例外を投げ、ok なら JSON を型付きで返す (onError の応答は型に出ないため) */
export const unwrap = async <T>(res: {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<T>
}): Promise<T> => {
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json()
}
