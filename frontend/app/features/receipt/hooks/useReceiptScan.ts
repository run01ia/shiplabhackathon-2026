import { useEffect, useState } from 'react'
import { supabase } from '~/lib/supabase'
import { fetchReceiptStatus, scanReceipt } from '../api'
import { shrinkImage } from '../image'
import type { ScanResult } from '../types'

export type ScanState =
  /** 機能が無効 (キー未設定)、または確認中。何も出さない */
  | { phase: 'hidden' }
  | { phase: 'ready'; remaining: number; error?: string }
  | { phase: 'reading' }
  | { phase: 'done'; result: ScanResult }

const accessToken = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('もう一度ログインしてね')
  return data.session.access_token
}

/**
 * レシートの読み取り。結果画面は clientAction の戻り値で描かれていて loader を持てないので、
 * この機能だけ hook から API を呼ぶ (使えるかの確認 → 画像を縮めて送る → 結果)
 */
export const useReceiptScan = (listId: string) => {
  const [state, setState] = useState<ScanState>({ phase: 'hidden' })

  useEffect(() => {
    let alive = true
    accessToken()
      .then(fetchReceiptStatus)
      .then((s) => {
        if (alive && s.enabled) setState({ phase: 'ready', remaining: s.remaining })
      })
      // 確認に失敗したら出さない (おまけの機能なので、結果画面をじゃましない)
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const scan = async (file: File) => {
    if (state.phase !== 'ready') return
    const { remaining } = state
    setState({ phase: 'reading' })
    try {
      // トークンの取得と画像の縮小は独立なので並べる
      const [token, image] = await Promise.all([accessToken(), shrinkImage(file)])
      setState({ phase: 'done', result: await scanReceipt(token, listId, image) })
    } catch (e) {
      const error = e instanceof Error ? e.message : 'うまく読めなかった…'
      // 残り回数は、失敗の種類で変わるので取り直す (取れなければ手元の値)
      const left = await accessToken()
        .then(fetchReceiptStatus)
        .then((s) => s.remaining)
        .catch(() => remaining)
      setState({ phase: 'ready', remaining: left, error })
    }
  }

  return { state, scan }
}
