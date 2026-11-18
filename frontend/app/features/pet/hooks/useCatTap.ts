import { createContext, useContext } from 'react'
import type { Side } from '../types'

type Listener = (side: Side) => void
export type CatTap = {
  /** 相棒が肉球で「ぺち」と叩く (左右交互)。操作のハンドラから呼ぶ */
  tap: () => void
  /** キャラ側が叩く合図を受け取る (内部用) */
  subscribe: (listener: Listener) => () => void
}

/** 合図は state を通さずに配る。tap() で画面は再レンダリングされない */
export const createCatTap = (): CatTap => {
  const listeners = new Set<Listener>()
  let side: Side = 'right'
  return {
    tap() {
      side = side === 'left' ? 'right' : 'left'
      for (const l of listeners) l(side)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

// Provider の外 (ログイン画面など) では何もしない
const NOOP: CatTap = { tap: () => {}, subscribe: () => () => {} }
export const CatTapContext = createContext<CatTap>(NOOP)

/** `const { tap } = useCatTap()`。tap は参照が変わらない */
export const useCatTap = () => useContext(CatTapContext)
