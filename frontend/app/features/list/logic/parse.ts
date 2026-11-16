/** フォームの予算 (円の整数、0 以上)。不正なら null */
export const parseBudget = (v: FormDataEntryValue | null): number | null => {
  const n = Number(String(v ?? '').replace(/[,，¥\s]/g, ''))
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** 品目名 (前後の空白を除く)。空なら null */
export const parseName = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}

export const formatYen = (n: number) => `¥ ${n.toLocaleString()}`
