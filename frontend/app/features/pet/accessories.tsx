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
  // ここから下の帽子は、おみやげ (ドロップ) 限定。backend の items.rarity と対応する
  straw: {
    key: 'straw',
    slot: 'head',
    iconViewBox: '-68 -48 136 66',
    art: (
      <>
        <ellipse cx="0" cy="2" rx="62" ry="12" fill="#f3d27a" stroke={S} strokeWidth="5" />
        <path
          d="M-34 0q2-40 34-40t34 40z"
          fill="#f3d27a"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M-32-8q32 9 64 0" fill="none" stroke="#f2542d" strokeWidth="7" />
      </>
    ),
  },
  beanie: {
    key: 'beanie',
    slot: 'head',
    iconViewBox: '-52 -66 104 78',
    art: (
      <>
        <path
          d="M-40-2q0-46 40-46t40 46z"
          fill="#4aa3ff"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M-20-40v28M0-46v34M20-40v28" stroke={S} strokeWidth="3" opacity=".25" />
        <rect
          x="-45"
          y="-12"
          width="90"
          height="17"
          rx="8.5"
          fill="#fff"
          stroke={S}
          strokeWidth="5"
        />
        <circle cx="0" cy="-52" r="9" fill="#fff" stroke={S} strokeWidth="4" />
      </>
    ),
  },
  chef: {
    key: 'chef',
    slot: 'head',
    iconViewBox: '-58 -82 116 92',
    art: (
      <>
        <path
          d="M-28-8v-22q-22-6-14-24q8-14 24-8q18-16 36 0q16-6 24 8q8 18-14 24v22z"
          fill="#fff"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M-12-34v14M12-34v14"
          stroke={S}
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".3"
        />
        <rect
          x="-31"
          y="-13"
          width="62"
          height="17"
          rx="5"
          fill="#fff"
          stroke={S}
          strokeWidth="5"
        />
      </>
    ),
  },
  wizard: {
    key: 'wizard',
    slot: 'head',
    iconViewBox: '-64 -80 128 98',
    art: (
      <>
        <ellipse cx="0" cy="2" rx="56" ry="11" fill="#7b5cff" stroke={S} strokeWidth="5" />
        <path
          d="M-30 0l22-58q6-14 22-10q-10 4-8 14l24 54z"
          fill="#7b5cff"
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M-27-8q27 9 54 0" fill="none" stroke="#ffc93c" strokeWidth="7" />
        <path d="M0-42l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#ffc93c" />
        <circle cx="-9" cy="-22" r="2.5" fill="#ffc93c" />
        <circle cx="11" cy="-24" r="2" fill="#ffc93c" />
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
