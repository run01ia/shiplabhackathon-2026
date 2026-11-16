import { useEffect, useRef, useState } from 'react'
import { useCatTap } from '../hooks/useCatTap'
import type { Mood } from '../types'
import { Character } from './Character'

type Props = { accessories?: readonly string[] }

/** この間隔 (ms) 以内に続けて叩くとコンボ。COMBO 回つながると、少しのあいだ喜ぶ */
const COMBO_GAP = 1500
const COMBO = 4
const JOY_MS = 1200

/** 下タブの上に座る相棒。操作 (tap()) のたびに肉球で「ぺち」と叩く。タップは下の画面に通す */
export function CatCompanion({ accessories }: Props) {
  const { subscribe } = useCatTap()
  const [mood, setMood] = useState<Mood>('happy')
  const combo = useRef({ count: 0, last: 0 })

  // 操作が続くと乗ってくる (喜ぶ顔になって跳ねる)。再レンダリングはコンボの成立時だけ
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = subscribe(() => {
      const now = performance.now()
      const c = combo.current
      c.count = now - c.last < COMBO_GAP ? c.count + 1 : 1
      c.last = now
      if (c.count < COMBO) return
      c.count = 0
      setMood('joy')
      clearTimeout(timer)
      timer = setTimeout(() => setMood('happy'), JOY_MS)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [subscribe])

  return (
    <div
      className="pointer-events-none absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+68px)] z-4"
      aria-hidden="true"
    >
      <Character accessories={accessories} mood={mood} size={62} reactToTap />
    </div>
  )
}
