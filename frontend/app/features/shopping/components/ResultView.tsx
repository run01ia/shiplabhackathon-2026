import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Card } from '~/components/Card'
import { ScreenTitle } from '~/components/Screen'
import { ReceiptCard } from '~/features/receipt'
import { formatYen } from '../logic/yen'
import type { FinishResult } from '../types'
import { ShoppingPet } from './ShoppingPet'
import { Souvenir } from './Souvenir'

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const tone = (n: number) => (n < 0 ? 'text-red' : 'text-mint')

/** 結果・判定: 内訳、ポイント増減、ペットの表情 */
export function ResultView({ result }: { result: FinishResult }) {
  const ok = result.withinBudget
  const drop = result.drop
  const levelUp = result.levelUp
  const reduced = useReducedMotion()
  // 箱を開けたら、もらった帽子をその場でかぶる
  const [opened, setOpened] = useState(false)
  const hat = opened && drop && 'key' in drop ? drop.key : undefined
  return (
    <>
      <Card className="text-center">
        <ShoppingPet mood={hat ? 'joy' : ok ? 'happy' : 'sad'} size={150} hat={hat} />
        <ScreenTitle className="mt-1.5 mb-0">
          {ok ? '予算内でクリア！' : 'ちょっと使いすぎ…'}
        </ScreenTitle>
        <div className="text-xs font-normal text-muted">
          {ok
            ? `のこり ${formatYen(result.remaining)} でおさまった`
            : `予算を ${formatYen(-result.remaining)} オーバー`}
        </div>
      </Card>
      <Card>
        {result.breakdown.map((r) => (
          <div
            key={r.label}
            className="flex justify-between border-b-2 border-dashed border-gray py-1.5"
          >
            <span>{r.label}</span>
            <b className={tone(r.points)}>{signed(r.points)}</b>
          </div>
        ))}
        {result.rewardedToday ? null : (
          <p className="py-1.5 text-xs text-muted">
            ごほうびは 1 日 1 回。今日の分はもうもらったよ、また明日！
          </p>
        )}
        <div className="flex justify-between py-1.5 text-xl">
          <span>合計</span>
          <b className={tone(result.total)}>{signed(result.total)}</b>
        </div>
      </Card>
      {levelUp ? (
        <motion.div
          className="mb-3.5 rounded-card border-3 border-ink bg-sun p-3 text-center shadow-pop"
          initial={reduced ? false : { scale: 0.6, rotate: -4 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 11, delay: 0.4 }}
        >
          <small className="block text-xs tracking-[0.25em]">LEVEL UP!</small>
          <b className="block text-2xl">Lv.{levelUp.to} になった！</b>
          <span className="text-xs font-normal">ホームで すがたを見てみよう</span>
        </motion.div>
      ) : null}
      {drop ? <Souvenir drop={drop} onOpen={() => setOpened(true)} /> : null}
      {/* レシートの AI 判定 (REQ-012)。機能が無効なら何も出ない */}
      <ReceiptCard listId={result.list.id} />
      {/* Link をボタンの見た目にする (Button は <button> なので使えない) */}
      <Link
        to="/home"
        className="block min-h-13 rounded-btn border-3 border-ink bg-sun p-3 text-center text-[17px] text-ink no-underline shadow-pop"
      >
        ホームにもどる
      </Link>
    </>
  )
}
