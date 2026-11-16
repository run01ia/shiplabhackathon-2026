import { useCallback, useEffect, useState } from 'react'
import { Toast } from '~/components/Toast'
import { useCatTap } from '~/features/pet'

type Bonus = { delta: number } | null | undefined

/** リストの作成・閲覧ポイント (1 日 1 回) が付いたら、トーストを出して猫に「ぺち」させる */
export function ListBonusToast({ bonus }: { bonus: Bonus }) {
  const { tap } = useCatTap()
  // 閉じたボーナス (オブジェクトの参照) を覚える。再取得で新しいボーナスが来たら、また出す
  const [dismissed, setDismissed] = useState<Bonus>(null)
  const clear = useCallback(() => setDismissed(bonus), [bonus])

  useEffect(() => {
    if (bonus) tap()
  }, [bonus, tap])

  const message = bonus && bonus !== dismissed ? `+${bonus.delta} リストを準備した` : null
  return <Toast message={message} onDone={clear} />
}
