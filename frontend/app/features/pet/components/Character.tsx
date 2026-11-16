import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { resolveAccessories } from '../accessories'
import { BREATHE, IDLE, KEYFRAMES, TAP } from '../animations'
import { CHARACTERS, DEFAULT_CHARACTER } from '../characters'
import { useCatTap } from '../hooks/useCatTap'
import type { CharacterDefinition, Mood, Point } from '../types'

type Props = {
  definition?: CharacterDefinition
  mood?: Mood
  /** 着用中のアイテムの key。同じ slot は 1 つだけ描く */
  accessories?: readonly string[]
  size?: number
  /** まばたき・しっぽ・呼吸 */
  idle?: boolean
  /** ふわふわ上下する */
  bob?: boolean
  /** useCatTap() の tap() に合わせて手で叩く */
  reactToTap?: boolean
}

const NONE: readonly string[] = []
const INK = '#2b2118'
const origin = (p: Point) => ({ transformOrigin: `${p.x}px ${p.y}px` })

// 叩いた瞬間に出る火花 (手の中心が 0,0)
const spark = (
  <path
    d="M-17-13l-6-7M0-18v-9M17-13l6-7"
    stroke={INK}
    strokeWidth="4"
    strokeLinecap="round"
    fill="none"
  />
)

/** 定義 (CharacterDefinition) を受け取って描く、キャラ共通のコンポーネント */
export function Character({
  definition = CHARACTERS[DEFAULT_CHARACTER],
  mood = 'happy',
  accessories = NONE,
  size = 200,
  idle = true,
  bob = false,
  reactToTap = false,
}: Props) {
  const { viewBox, parts, pivots, slots, accessoryAdjust } = definition
  const face = parts.face[mood]
  const reduced = useReducedMotion()
  const { subscribe } = useCatTap()

  // 手の動きは MotionValue で直接動かす (叩くたびに再レンダリングしない)
  const leftY = useMotionValue(0)
  const rightY = useMotionValue(0)
  const leftSpark = useMotionValue(0)
  const rightSpark = useMotionValue(0)

  useEffect(() => {
    if (!reactToTap) return
    const lift = viewBox.height * (reduced ? TAP.liftReduced : TAP.lift)
    return subscribe((side) => {
      const isLeft = TAP.part[side] === 'pawLeft'
      animate(isLeft ? leftY : rightY, [0, -lift, 0], {
        duration: TAP.duration,
        times: [0, 0.45, 1],
        ease: ['easeOut', 'easeIn'],
      })
      animate(isLeft ? leftSpark : rightSpark, [0, 1, 0], {
        duration: 0.28,
        delay: TAP.duration * 0.8,
      })
    })
  }, [reactToTap, reduced, subscribe, viewBox.height, leftY, rightY, leftSpark, rightSpark])

  return (
    <div
      className={`mx-auto ${bob ? 'animate-bob motion-reduce:animate-none' : ''}`}
      style={{ width: size, height: (size * viewBox.height) / viewBox.width }}
    >
      <style href="pet-keyframes" precedence="medium">
        {KEYFRAMES}
      </style>
      <div className={`size-full ${idle ? BREATHE : ''}`}>
        <svg
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="block size-full overflow-visible"
          role="img"
          aria-label={definition.name}
        >
          <g className={idle ? IDLE.tail : undefined} style={origin(pivots.tail)}>
            {parts.tail}
          </g>
          {parts.body}
          {parts.head}
          <g className={idle ? IDLE.eyes : undefined} style={origin(pivots.eyes)}>
            {face.eyes}
          </g>
          {face.mouth}
          {resolveAccessories(accessories).map((a) => {
            const s = slots[a.slot]
            const adj = accessoryAdjust?.[a.key]
            const x = s.x + (adj?.dx ?? 0)
            const y = s.y + (adj?.dy ?? 0)
            const rotate = (s.rotate ?? 0) + (adj?.rotate ?? 0)
            const scale = (s.scale ?? 1) * (adj?.scale ?? 1)
            return (
              <g key={a.key} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
                {a.art}
              </g>
            )
          })}
          <motion.g style={{ y: leftY }}>{parts.pawLeft}</motion.g>
          <motion.g style={{ y: rightY }}>{parts.pawRight}</motion.g>
          {reactToTap ? (
            <>
              <g transform={`translate(${pivots.pawLeft.x} ${pivots.pawLeft.y})`}>
                <motion.g style={{ opacity: leftSpark }}>{spark}</motion.g>
              </g>
              <g transform={`translate(${pivots.pawRight.x} ${pivots.pawRight.y})`}>
                <motion.g style={{ opacity: rightSpark }}>{spark}</motion.g>
              </g>
            </>
          ) : null}
        </svg>
      </div>
    </div>
  )
}
