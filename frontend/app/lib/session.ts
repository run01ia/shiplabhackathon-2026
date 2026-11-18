import { redirect } from 'react-router'
import { supabase } from './supabase'

/** ブラウザ側のガード。セッションがなければ /login へ。あればアクセストークンを返す */
export const requireAccessToken = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw redirect('/login')
  return data.session.access_token
}

/** ログイン済みなら /home へ (ログイン画面用) */
export const redirectIfLoggedIn = async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) throw redirect('/home')
}
