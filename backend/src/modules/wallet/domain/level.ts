/** ペットのレベル (REQ-007)。しきい値は仮の値 (#8 で確定)。式はここだけに置き、SQL には配列で渡す */
export const MAX_LEVEL = 99
const BASE_EXP = 50
const STEP_EXP = 25

/** レベル level → level + 1 に必要な経験値 (Lv.1 → 2 は 50、以後 25 ずつ増える) */
export const expToNext = (level: number): number => BASE_EXP + STEP_EXP * (level - 1)

/** レベル 2, 3, ... MAX_LEVEL に届く、累計の経験値 */
export const LEVEL_THRESHOLDS: readonly number[] = (() => {
  const totals: number[] = []
  let total = 0
  for (let level = 1; level < MAX_LEVEL; level++) {
    total += expToNext(level)
    totals.push(total)
  }
  return totals
})()

/** 累計の経験値からレベルを求める (しきい値ちょうどで上がる) */
export const levelForExp = (exp: number): number =>
  1 + LEVEL_THRESHOLDS.filter((t) => t <= exp).length

export type LevelProgress = {
  level: number
  /** 今のレベルになってから貯めた経験値 */
  levelExp: number
  /** 次のレベルに必要な経験値 (最大レベルでは 0) */
  nextLevelExp: number
}

/** ゲージに出す進み具合 */
export const levelProgress = (exp: number): LevelProgress => {
  const level = levelForExp(exp)
  if (level >= MAX_LEVEL) return { level, levelExp: 0, nextLevelExp: 0 }
  // 今のレベルに届いたときの累計 (Lv.1 は 0)
  const reached = LEVEL_THRESHOLDS[level - 2] ?? 0
  return { level, levelExp: exp - reached, nextLevelExp: expToNext(level) }
}

/** ポイントのうち経験値になる量。マイナスでは減らさない (育ったペットは縮まない) */
export const expGain = (delta: number): number => Math.max(delta, 0)
