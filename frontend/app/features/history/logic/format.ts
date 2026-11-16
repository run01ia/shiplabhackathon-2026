// 純粋関数 (React 非依存)。表示は JST で固定する
const dateFmt = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
})
const dateTimeFmt = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** "11/15" */
export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '')

/** "11/16 09:00" */
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))

/** 使った金額 = 金額が入っている品目の合計 (品目を直すと表示も追従する) */
export const sumPrices = (items: { price: number | null }[]) =>
  items.reduce((a, x) => a + (x.price ?? 0), 0)

const nonDigit = /\D/g

/** "¥ 1,200" のような入力から円の整数を取り出す。数字がなければ undefined */
export const parseYen = (raw: string) => {
  const digits = raw.replace(nonDigit, '')
  return digits ? Number(digits) : undefined
}

type Fix = { itemId: string; price?: number; isUnnecessary: boolean }

/** 送信中の修正を先に反映する (楽観的表示)。該当がなければそのまま返す */
export const applyFix = <
  T extends { items: { id: string; price: number | null; isUnnecessary: boolean }[] },
>(
  lists: T[],
  fix: Fix | null,
): T[] => {
  if (!fix) return lists
  return lists.map((g) =>
    g.items.some((x) => x.id === fix.itemId)
      ? {
          ...g,
          items: g.items.map((x) =>
            x.id === fix.itemId
              ? { ...x, price: fix.price ?? x.price, isUnnecessary: fix.isUnnecessary }
              : x,
          ),
        }
      : g,
  )
}
