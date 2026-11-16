import { motion } from 'motion/react'
import { resolveAccessories } from '../accessories'
import { BREATHE, BREATHE_SLEEP, IDLE, KEYFRAMES, TAIL, ZZZ } from '../animations'
import { CHARACTERS, DEFAULT_CHARACTER } from '../characters'
import { useCharacterMotion } from '../hooks/useCharacterMotion'
import type { CharacterDefinition, Mood, Point } from '../types'

type Props = {
  definition?: CharacterDefinition
  mood?: Mood
  /** 着用中のアイテムの key。同じ slot は 1 つだけ描く */
  accessories?: readonly string[]
  size?: number
  /** まばたき・しっぽ・呼吸・耳・首かしげ */
  idle?: boolean
  /** ふわふわ上下する */
  bob?: boolean
  /** useCatTap() の tap() に合わせて手で叩く */
  reactToTap?: boolean
  /** 値が変わるたびに、いまの気分の反応 (喜ぶ = 跳ねる) をもう一度する */
  pulse?: number
  /** 足元の影 */
  shadow?: boolean
}

const NONE: readonly string[] = []
const INK = '#2b2118'
const origin = (p: Point) => ({ transformOrigin: `${p.x}px ${p.y}px` })
const EAR_ORIGIN = { originX: 0.5, originY: 1 }
const ZS = [0, 1, 2] as const

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
  pulse = 0,
  shadow = false,
}: Props) {
  const { viewBox, parts, pivots, slots, accessoryAdjust } = definition
  const face = parts.face[mood]
  const m = useCharacterMotion({ mood, pulse, reactToTap, size, viewHeight: viewBox.height })
  const on = (className?: string) => (idle ? className : undefined)

  return (
    <div
      className={`relative mx-auto ${bob ? 'animate-bob motion-reduce:animate-none' : ''}`}
      style={{ width: size, height: (size * viewBox.height) / viewBox.width }}
    >
      <style href="pet-keyframes-2" precedence="medium">
        {KEYFRAMES}
      </style>
      {shadow ? (
        <motion.div
          className="absolute inset-x-[16%] -bottom-[3%] h-[10%] rounded-[50%] bg-ink/15"
          style={{ scale: m.shadow }}
        />
      ) : null}
      <motion.div className="relative size-full" style={{ y: m.hopY, rotate: m.spin }}>
        <motion.div
          className="size-full origin-bottom"
          style={{ scaleX: m.scaleX, scaleY: m.scaleY }}
        >
          <div className={`size-full ${idle ? (mood === 'sleep' ? BREATHE_SLEEP : BREATHE) : ''}`}>
            <svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              className="block size-full overflow-visible"
              role="img"
              aria-label={definition.name}
            >
              <g className={on(TAIL[mood])} style={origin(pivots.tail)}>
                {parts.tail}
              </g>
              {parts.body}
              <motion.g style={{ y: m.headY, rotate: m.headRotate, ...EAR_ORIGIN }}>
                <g className={on(IDLE.head)} style={origin(pivots.head ?? slots.neck)}>
                  {parts.earLeft ? (
                    <motion.g style={{ rotate: m.earLeft, ...EAR_ORIGIN }}>
                      <g className={on(IDLE.earLeft)} style={origin(pivots.earLeft ?? slots.head)}>
                        {parts.earLeft}
                      </g>
                    </motion.g>
                  ) : null}
                  {parts.earRight ? (
                    <motion.g style={{ rotate: m.earRight, ...EAR_ORIGIN }}>
                      <g
                        className={on(IDLE.earRight)}
                        style={origin(pivots.earRight ?? slots.head)}
                      >
                        {parts.earRight}
                      </g>
                    </motion.g>
                  ) : null}
                  {parts.head}
                  {/* 表情が変わる瞬間に、目をぱちっと閉じてから開く */}
                  <motion.g
                    key={mood}
                    initial={{ scaleY: 0.15 }}
                    animate={{ scaleY: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                  >
                    <g className={on(IDLE.eyes)} style={origin(pivots.eyes)}>
                      {face.eyes}
                    </g>
                  </motion.g>
                  {face.mouth}
                  {resolveAccessories(accessories).map((a) => {
                    const s = slots[a.slot]
                    const adj = accessoryAdjust?.[a.key]
                    const x = s.x + (adj?.dx ?? 0)
                    const y = s.y + (adj?.dy ?? 0)
                    const rotate = (s.rotate ?? 0) + (adj?.rotate ?? 0)
                    const scale = (s.scale ?? 1) * (adj?.scale ?? 1)
                    return (
                      <g
                        key={a.key}
                        transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
                      >
                        {a.art}
                      </g>
                    )
                  })}
                </g>
              </motion.g>
              <motion.g style={{ y: m.leftY }}>{parts.pawLeft}</motion.g>
              <motion.g style={{ y: m.rightY }}>{parts.pawRight}</motion.g>
              {reactToTap ? (
                <>
                  <g transform={`translate(${pivots.pawLeft.x} ${pivots.pawLeft.y})`}>
                    <motion.g style={{ opacity: m.leftSpark, scale: m.leftSpark }}>
                      {spark}
                    </motion.g>
                  </g>
                  <g transform={`translate(${pivots.pawRight.x} ${pivots.pawRight.y})`}>
                    <motion.g style={{ opacity: m.rightSpark, scale: m.rightSpark }}>
                      {spark}
                    </motion.g>
                  </g>
                </>
              ) : null}
            </svg>
          </div>
        </motion.div>
      </motion.div>
      {mood === 'sleep' ? (
        <div
          className="pointer-events-none absolute top-[8%] left-[8%] leading-none"
          style={{ fontSize: Math.max(11, size * 0.1) }}
          aria-hidden="true"
        >
          {ZS.map((i) => (
            <span key={i} className={ZZZ} style={{ animationDelay: `${i * 0.9}s` }}>
              z
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
