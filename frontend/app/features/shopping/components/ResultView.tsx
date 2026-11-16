import { Link } from 'react-router'
import { Card } from '~/components/Card'
import { ScreenTitle } from '~/components/Screen'
import { formatYen } from '../logic/yen'
import type { FinishResult } from '../types'
import { ShoppingPet } from './ShoppingPet'

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const tone = (n: number) => (n < 0 ? 'text-red' : 'text-mint')

/** 結果・判定: 内訳、ポイント増減、ペットの表情 */
export function ResultView({ result }: { result: FinishResult }) {
  const ok = result.withinBudget
  return (
    <>
      <Card className="text-center">
        <ShoppingPet mood={ok ? 'happy' : 'sad'} size={150} />
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
        <div className="flex justify-between py-1.5 text-xl">
          <span>合計</span>
          <b className={tone(result.total)}>{signed(result.total)}</b>
        </div>
      </Card>
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
