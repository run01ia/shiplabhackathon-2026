import { type ReactNode, useState } from 'react'
import { CatTapContext, createCatTap } from '../hooks/useCatTap'

/** tab-layout に 1 つ置く。配下の画面は useCatTap() の tap() を呼べる */
export function CatTapProvider({ children }: { children: ReactNode }) {
  const [value] = useState(createCatTap)
  return <CatTapContext value={value}>{children}</CatTapContext>
}
