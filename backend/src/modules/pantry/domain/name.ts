// 品目名の比較。表記ゆれ (全角半角、空白、カタカナ / ひらがな、大文字小文字) を吸収する。
// 漢字とかなの違い (卵 / たまご) は吸収しない (辞書が要るため)

const KATAKANA = /[ァ-ヶ]/g

/** 比較用のキーにする。「 ギュウニュウ」「ｷﾞｭｳﾆｭｳ」「ぎゅうにゅう」は同じキーになる */
export const nameKey = (name: string): string =>
  name
    // 全角英数 → 半角、半角カナ → 全角カナ (濁点もまとまる)
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(KATAKANA, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

/** names のうち、在庫にあるものを返す (names の順。同じ名前は 1 回だけ) */
export const findInPantry = <T extends { key: string }>(
  names: readonly string[],
  pantry: readonly T[],
): { name: string; item: T }[] => {
  const byKey = new Map(pantry.map((p) => [p.key, p]))
  const seen = new Set<string>()
  const hits: { name: string; item: T }[] = []
  for (const name of names) {
    const item = byKey.get(nameKey(name))
    if (!item || seen.has(name)) continue
    seen.add(name)
    hits.push({ name, item })
  }
  return hits
}

/** 同じキーの名前を 1 つにまとめる (後の表記を残す)。キーが空になる名前は捨てる */
export const toEntries = (names: readonly string[]): { name: string; key: string }[] => {
  const byKey = new Map<string, { name: string; key: string }>()
  for (const raw of names) {
    const name = raw.trim()
    const key = nameKey(name)
    if (key) byKey.set(key, { name, key })
  }
  return [...byKey.values()]
}
