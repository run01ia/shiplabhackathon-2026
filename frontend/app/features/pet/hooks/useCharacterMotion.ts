import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { DROOP, HOP, TAP } from '../animations'
import type { Mood } from '../types'
import { useCatTap } from './useCatTap'

type Options = {
  mood: Mood
  /** 値が変わるたびに、いまの気分の反応をもう一度する (なでるたびに跳ねる) */
  pulse: number
  reactToTap: boolean
  /** 表示サイズ (px) と viewBox の高さ */
  size: number
  viewHeight: number
}

/**
 * キャラの反応 (ぺち・喜ぶ・しょんぼり) を MotionValue で直接動かす。
 * state を通さないので、叩くたび・跳ねるたびに再レンダリングしない。
 */
export function useCharacterMotion({ mood, pulse, reactToTap, size, viewHeight }: Options) {
  const reduced = useReducedMotion()
  const { subscribe } = useCatTap()

  const leftY = useMotionValue(0)
  const rightY = useMotionValue(0)
  const leftSpark = useMotionValue(0)
  const rightSpark = useMotionValue(0)
  const hopY = useMotionValue(0)
  const scaleY = useMotionValue(1)
  // つぶれたぶん横に広がる (体積を保つと柔らかく見える)
  const scaleX = useTransform(scaleY, (v) => 1 + (1 - v) * 0.7)
  const shadow = useTransform(hopY, (v) => 1 + v / (size * HOP.height * 3))
  const headY = useMotionValue(0)
  const earRight = useMotionValue(0)
  const earLeft = useTransform(earRight, (v) => -v)

  useEffect(() => {
    if (!reactToTap) return
    const lift = viewHeight * (reduced ? TAP.liftReduced : TAP.lift)
    return subscribe((side) => {
      const isLeft = TAP.part[side] === 'pawLeft'
      // 行き過ぎて (下に 2) 戻ると、叩いた重さが出る
      animate(isLeft ? leftY : rightY, [0, -lift, 2, 0], {
        duration: TAP.duration + 0.08,
        times: [0, 0.4, 0.75, 1],
        ease: ['easeOut', 'easeIn', 'easeOut'],
      })
      animate(isLeft ? leftSpark : rightSpark, [0, 1, 0], {
        duration: 0.26,
        delay: TAP.duration * 0.8,
      })
      if (reduced) return
      animate(scaleY, TAP.squash, { duration: 0.05, delay: TAP.duration * 0.8 }).then(() =>
        animate(scaleY, 1, { type: 'spring', stiffness: 700, damping: 10 }),
      )
    })
  }, [reactToTap, reduced, subscribe, viewHeight, leftY, rightY, leftSpark, rightSpark, scaleY])

  // biome-ignore lint/correctness/useExhaustiveDependencies: pulse が変わったら同じ気分でも反応し直す
  useEffect(() => {
    const sad = mood === 'sad'
    animate(headY, sad ? DROOP.head : 0, { type: 'spring', stiffness: 160, damping: 14 })
    animate(earRight, sad ? DROOP.ear : 0, { type: 'spring', stiffness: 160, damping: 12 })
    if (mood !== 'joy' || reduced) return
    const options = { duration: HOP.duration, times: [...HOP.times] }
    animate(scaleY, [...HOP.scaleY], options)
    animate(hopY, [0, 0, -size * HOP.height, 0, 0], {
      ...options,
      ease: ['linear', 'easeOut', 'easeIn', 'linear'],
    })
  }, [mood, pulse, reduced, size, headY, earRight, scaleY, hopY])

  return {
    leftY,
    rightY,
    leftSpark,
    rightSpark,
    hopY,
    scaleX,
    scaleY,
    shadow,
    headY,
    earLeft,
    earRight,
  }
}
