/** 1980 → "¥1,980" */
export const formatYen = (n: number) => `${n < 0 ? '-' : ''}¥${Math.abs(n).toLocaleString()}`

/** "¥ 1,980" や "１９８０" → 1980。数字がない、上限超えは null */
export const parseYen = (s: string): number | null => {
  const digits = s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xfee0)).replace(/\D/g, '')
  if (!digits) return null
  const n = Number(digits)
  return n <= 10_000_000 ? n : null
}
