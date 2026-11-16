import { redirect } from 'react-router'
import { supabase } from './supabase'

// サーバー (SSR) の loader は localStorage のセッションを見られないため、
// 「ログイン中らしい」ことだけを示す目印 cookie を持つ。認可の正は API 側の JWT 検証。
const MARK = 'okaimono_login'

export const markLoggedIn = () => {
  // biome-ignore lint/suspicious/noDocumentCookie: SSR が読む目印 cookie。Cookie Store API は対応が不十分
  document.cookie = `${MARK}=1; path=/; max-age=2592000; samesite=lax`
}

export const clearLoggedInMark = () => {
  // biome-ignore lint/suspicious/noDocumentCookie: 同上
  document.cookie = `${MARK}=; path=/; max-age=0; samesite=lax`
}

/** SSR 側のガード。目印 cookie がなければ /login へ */
export const requireLoginMark = (request: Request) => {
  if (!request.headers.get('Cookie')?.includes(`${MARK}=1`)) throw redirect('/login')
}

/** ブラウザ側のガード。セッションがなければ /login へ。あればアクセストークンを返す */
export const requireAccessToken = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    clearLoggedInMark()
    throw redirect('/login')
  }
  return data.session.access_token
}
