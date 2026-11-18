import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { DROOP, HOP, joyKind, SPIN_HEIGHT, TAP, WIGGLE } from '../animations'
import type { Mood } from '../types'
import { useCatTap } from './useCatTap'

type Options = {
  mood: Mood
  /** 値が変わるたびに、いまの気分の反応をもう一度する (なでるたびに喜ぶ) */
  pulse: number
  reactToTap: boolean
  /** 表示サイズ (px) と viewBox の高さ */
  size: number
  viewHeight: number
}

const soft = { type: 'spring', stiffness: 160, damping: 13 } as const

/**
 * キャラの反応 (ぺち・喜ぶ・しょんぼり・居眠り) を MotionValue で直接動かす。
 * state を通さないので、叩くたび・跳ねるたびに再レンダリングしない。
 */
export function useCharacterMotion({ mood, pulse, reactToTap, size, viewHeight }: Options) {
  const reduced = useReducedMotion()
  const { subscribe } = useCatTap()
  const before = useRef(mood)

  const leftY = useMotionValue(0)
  const rightY = useMotionValue(0)
  const leftSpark = useMotionValue(0)
  const rightSpark = useMotionValue(0)
  const hopY = useMotionValue(0)
  const spin = useMotionValue(0)
  const scaleY = useMotionValue(1)
  // つぶれたぶん横に広がる (体積を保つと柔らかく見える)
  const scaleX = useTransform(scaleY, (v) => 1 + (1 - v) * 0.7)
  const shadow = useTransform(hopY, (v) => Math.max(0.5, 1 + v / (size * 0.4)))
  const headY = useMotionValue(0)
  const headRotate = useMotionValue(0)
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
      // 跳ねている最中は、つぶれを上書きしない
      if (reduced || hopY.isAnimating()) return
      animate(scaleY, [1, 1, TAP.squash], {
        duration: TAP.duration,
        times: [0, 0.75, 1],
      }).then(() => animate(scaleY, 1, { type: 'spring', stiffness: 700, damping: 10 }))
    })
  }, [
    reactToTap,
    reduced,
    subscribe,
    viewHeight,
    leftY,
    rightY,
    leftSpark,
    rightSpark,
    scaleY,
    hopY,
  ])

  useEffect(() => {
    const woke = before.current === 'sleep' && mood !== 'sleep'
    before.current = mood
    animate(headY, DROOP[mood].head, soft)
    animate(earRight, DROOP[mood].ear, soft)
    if (reduced) return
    const jump = (height: number, duration: number) => {
      const options = { duration, times: [...HOP.times] }
      animate(scaleY, [...HOP.scaleY], options)
      animate(hopY, [0, 0, -size * height, 0, 0], {
        ...options,
        ease: ['linear', 'easeOut', 'easeIn', 'linear'],
      })
    }
    if (mood !== 'joy') {
      // 起こされたら、びくっと小さく跳ねる
      if (woke) jump(HOP.height * 0.5, 0.36)
      return
    }
    const kind = joyKind(pulse)
    if (kind === 'wiggle') {
      animate(headRotate, [...WIGGLE], { duration: 0.6 })
      animate(scaleY, [1, 0.95, 1.02, 1], { duration: 0.6 })
    } else if (kind === 'spin') {
      // 大技: 深く溜めて、高く跳んで 1 回転
      jump(SPIN_HEIGHT, 0.85)
      animate(spin, [0, 0, 360, 360], { duration: 0.85, times: [0, 0.2, 0.72, 1] }).then(() =>
        spin.set(0),
      )
    } else {
      jump(HOP.height, HOP.duration)
    }
  }, [mood, pulse, reduced, size, headY, headRotate, earRight, scaleY, hopY, spin])

  return {
    leftY,
    rightY,
    leftSpark,
    rightSpark,
    hopY,
    spin,
    scaleX,
    scaleY,
    shadow,
    headY,
    headRotate,
    earLeft,
    earRight,
  }
}
