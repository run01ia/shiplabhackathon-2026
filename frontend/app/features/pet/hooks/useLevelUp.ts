import { useEffect, useEffectEvent, useState } from 'react'

export type LevelUp = { from: number; to: number }

// 最後に画面で見せたレベル。リストや買い物で上がったぶんも、次にホームを開いたときに祝える
const KEY = 'pet:seenLevel'
const START_MS = 500

const readSeen = (): number | null => {
  try {
    const n = Number(localStorage.getItem(KEY))
    return Number.isInteger(n) && n >= 1 ? n : null
  } catch {
    return null
  }
}
const writeSeen = (level: number) => {
  try {
    localStorage.setItem(KEY, String(level))
  } catch {
    // 保存できなくても、演出が次回もう一度出るだけ
  }
}

type Options = {
  /** いまのレベル (サーバーの値) */
  level: number
  /** この画面で受け取った報酬のレベルアップ (あれば、上がる前のレベルが分かる) */
  hint: LevelUp | null
  /** 先に流す演出 (報酬のコイン) があるあいだは待つ */
  wait: boolean
  onStart: (levelUp: LevelUp) => void
}

/**
 * レベルアップの演出の進行。「まだ見せていないレベル」があれば、少し待ってから祝う。
 * shown は画面に出すレベル (祝うまでは上がる前の値)、pending は祝う前、celebration は演出中。
 */
export function useLevelUp({ level, hint, wait, onStart }: Options) {
  const [shown, setShown] = useState(() => Math.min(hint?.from ?? level, readSeen() ?? level))
  const [celebration, setCelebration] = useState<LevelUp | null>(null)
  const pending = level > shown

  const start = useEffectEvent(() => {
    const levelUp = { from: shown, to: level }
    writeSeen(level)
    setShown(level)
    setCelebration(levelUp)
    onStart(levelUp)
  })

  useEffect(() => {
    if (!pending) {
      writeSeen(level)
      return
    }
    if (wait) return
    const t = setTimeout(start, START_MS)
    return () => clearTimeout(t)
  }, [pending, wait, level])

  return { shown, pending, celebration, finish: () => setCelebration(null) }
}
