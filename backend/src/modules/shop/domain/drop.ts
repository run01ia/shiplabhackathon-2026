// おみやげ (帽子のドロップ) の抽選。確率とコインは仮置き。変えるのはこの定数だけ
export type Rarity = 'common' | 'rare' | 'epic'

/** 低い順。持っていない帽子がなければ、ここを下へたどる */
export const RARITIES: readonly Rarity[] = ['common', 'rare', 'epic']

/** 乱数 (0 以上 1 未満) がこの値未満ならそのレア度。ふつう 70% / レア 25% / 激レア 5% */
export const DROP_THRESHOLDS = { common: 0.7, rare: 0.95 } as const

/** 帽子が出せないとき (そのレア度以下を全部持っている) に換えるコイン */
export const DUPLICATE_COINS = 10

export type DropCandidate = {
  key: string
  name: string
  /** null はショップで買うアイテム (ドロップしない) */
  rarity: Rarity | null
  owned: boolean
}

export type DropPick = { key: string; name: string; rarity: Rarity }

export const rollRarity = (r: number): Rarity =>
  r < DROP_THRESHOLDS.common ? 'common' : r < DROP_THRESHOLDS.rare ? 'rare' : 'epic'

/**
 * 帽子を 1 つ選ぶ。random は 1 回目でレア度、2 回目でそのレア度の中の 1 つを決める。
 * そのレア度をすべて持っていたら下のレア度へ。下にもなければ null (コインに換える)。
 * 上のレア度には上げない (激レアの価値を保つ)。
 */
export const pickDrop = (
  items: readonly DropCandidate[],
  random: () => number,
): DropPick | null => {
  const rolled = RARITIES.indexOf(rollRarity(random()))
  for (let i = rolled; i >= 0; i--) {
    const rarity = RARITIES[i]
    if (!rarity) continue
    const pool = items.filter((it) => it.rarity === rarity && !it.owned)
    if (pool.length === 0) continue
    const picked = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)]
    if (picked) return { key: picked.key, name: picked.name, rarity }
  }
  return null
}
