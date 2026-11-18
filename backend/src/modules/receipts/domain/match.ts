// レシートの品目名とリストの品目名の、表記ゆれをならした一致 (Claude API を呼ばない読み取りで使う)

/** 全角半角をそろえ、空白を除き、カタカナをひらがなにする */
export const normalizeName = (name: string): string =>
  name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

/** リストのどれかと同じ品目か。どちらかがもう一方を含めば同じとみなす (「牛乳」と「牛乳 1L」) */
export const isOnList = (name: string, listNames: readonly string[]): boolean => {
  const target = normalizeName(name)
  if (!target) return false
  return listNames.some((n) => {
    const listed = normalizeName(n)
    return listed !== '' && (target.includes(listed) || listed.includes(target))
  })
}
