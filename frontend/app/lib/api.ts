// type-only: backend の実行時コードは front に取り込まない (型だけ共有する Hono RPC)
import type { AppType } from '@backend/app'
import { hc } from 'hono/client'
import type { SuccessStatusCode } from 'hono/utils/http-status'
import { redirect } from 'react-router'
import { supabase } from './supabase'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** アクセストークンを Authorization: Bearer で付ける型付きクライアント */
export const createApi = (accessToken: string) =>
  hc<AppType>(baseUrl, { headers: { Authorization: `Bearer ${accessToken}` } })

type Res = { ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }

/** 応答の union から 2xx の JSON の型だけを取り出す (zValidator の 400 などを除く) */
type OkBody<R> = R extends { status: infer S; json: () => Promise<infer T> }
  ? [Extract<S, SuccessStatusCode>] extends [never]
    ? never
    : T
  : never

/** zod の issues (配列か、その JSON 文字列) から最初の message を取る */
const firstIssue = (v: unknown): string | undefined => {
  const issues = typeof v === 'string' ? JSON.parse(v) : v
  return Array.isArray(issues) ? issues[0]?.message : undefined
}

/** エラー応答から画面に出す文言を取り出す。`{ error: string }` と zod の `{ success: false, error }` を扱う */
const errorMessage = async (res: Res): Promise<string> => {
  const fallback = `API error ${res.status}: ${res.statusText}`
  try {
    const body = (await res.json()) as { error?: unknown } | null
    const err = body?.error
    if (typeof err === 'string') return err
    if (err && typeof err === 'object') {
      const z = err as { issues?: unknown; message?: unknown }
      return firstIssue(z.issues) ?? firstIssue(z.message) ?? fallback
    }
  } catch {
    // JSON でない応答 (502 など) は既定の文言にする
  }
  return fallback
}

/** `!res.ok` なら文言付きで例外を投げ、ok なら 2xx の JSON を型付きで返す (204 は本文なし) */
export const unwrap = async <R extends Res>(res: R): Promise<OkBody<R>> => {
  // ログインが切れていたら (DB のリセットなど)、ログアウトしてログイン画面へ
  if (res.status === 401) {
    await supabase.auth.signOut()
    throw redirect('/login')
  }
  if (!res.ok) throw new Error(await errorMessage(res))
  if (res.status === 204) return undefined as OkBody<R>
  return res.json() as Promise<OkBody<R>>
}
