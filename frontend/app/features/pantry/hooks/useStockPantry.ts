import { useState } from 'react'
import { supabase } from '~/lib/supabase'
import { addToPantry } from '../api'

export type StockState = 'idle' | 'saving' | 'done' | 'error'

/**
 * 買ったものを在庫に入れる。結果画面は clientAction の戻り値で描かれていて loader を持てないので、
 * レシートの読み取りと同じく hook から API を呼ぶ
 */
export const useStockPantry = (names: string[]) => {
  const [state, setState] = useState<StockState>('idle')

  const stock = async () => {
    if (state === 'saving' || state === 'done') return
    setState('saving')
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('no session')
      await addToPantry(data.session.access_token, names)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return { state, stock }
}
