import { type AccessoryDefinition, SLOTS } from './types'

const S = '#2b2118'

/**
 * アクセサリーの一覧。key は backend の items.key と同じ。
 * 絵は slot の中心 (頭 = 頭のてっぺん、顔 = 両目の間、首 = あごの下) を (0,0) として描く。
 */
export const ACCESSORIES: Record<string, AccessoryDefinition> = {
  hat: {
    key: 'hat',
    slot: 'head',
    iconViewBox: '-58 -34 128 50',
    art: (
      <>
        <path
          d="M-48 4q48-52 96 0z"
          fill="#f2542d"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M20 0q40-6 42 6q-30 4-42-6z"
          fill="#f2542d"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-22" r="5" fill="#ffc93c" stroke={S} strokeWidth="3" />
      </>
    ),
  },
  crown: {
    key: 'crown',
    slot: 'head',
    iconViewBox: '-46 -42 92 52',
    art: (
      <>
        <path
          d="M-30 2l-6-34 22 18 14-24 14 24 22-18-6 34z"
          fill="#ffc93c"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-9" r="4" fill="#f2542d" />
        <circle cx="-17" cy="-7" r="3" fill="#3dbe8b" />
        <circle cx="17" cy="-7" r="3" fill="#3dbe8b" />
      </>
    ),
  },
  glasses: {
    key: 'glasses',
    slot: 'face',
    iconViewBox: '-50 -26 100 52',
    art: (
      <>
        <circle cx="-24" cy="0" r="17" fill="rgba(255,255,255,.4)" stroke={S} strokeWidth="5" />
        <circle cx="24" cy="0" r="17" fill="rgba(255,255,255,.4)" stroke={S} strokeWidth="5" />
        <path d="M-7 0h14" stroke={S} strokeWidth="5" />
      </>
    ),
  },
  ribbon: {
    key: 'ribbon',
    slot: 'neck',
    iconViewBox: '-34 -20 68 40',
    art: (
      <>
        <path d="M0 0l22-13v26z" fill="#ff6fa0" stroke={S} strokeWidth="4" strokeLinejoin="round" />
        <path
          d="M0 0l-22-13v26z"
          fill="#ff6fa0"
          stroke={S}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="0" r="7" fill="#ffc93c" stroke={S} strokeWidth="4" />
      </>
    ),
  },
}

/** 旧 Pet の名前 (モック由来) を items.key に読み替える */
const ALIASES: Record<string, string> = { cap: 'hat', bow: 'ribbon', glass: 'glasses' }

export const findAccessory = (key: string): AccessoryDefinition | undefined =>
  ACCESSORIES[ALIASES[key] ?? key]

/** 着用中の key から、描くアクセサリーを決める。同じ slot は後ろのものが勝つ。絵のない key は無視する */
export const resolveAccessories = (keys: readonly string[]): AccessoryDefinition[] => {
  const bySlot = new Map<string, AccessoryDefinition>()
  for (const key of keys) {
    const a = findAccessory(key)
    if (a) bySlot.set(a.slot, a)
  }
  return SLOTS.flatMap((slot) => bySlot.get(slot) ?? [])
}

/** key を着けるときに外す、同じ slot の着用中アイテム */
export const slotConflicts = (key: string, equippedKeys: readonly string[]): string[] => {
  const slot = findAccessory(key)?.slot
  if (!slot) return []
  return equippedKeys.filter((k) => k !== key && findAccessory(k)?.slot === slot)
}
