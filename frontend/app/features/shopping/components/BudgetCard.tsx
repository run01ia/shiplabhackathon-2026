import { Card } from '~/components/Card'
import { formatYen } from '../logic/yen'
import { ShoppingPet } from './ShoppingPet'

/** 買い物中は予算を見せるだけ (金額は入れない。使った合計は、終了画面でレシートか手入力で入れる) */
export function BudgetCard({ budget }: { budget: number }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <ShoppingPet mood="happy" size={70} />
        <div className="flex-1">
          <div className="text-xs font-normal text-muted">今日の予算</div>
          <b className="text-[30px] tabular-nums">{formatYen(budget)}</b>
        </div>
      </div>
    </Card>
  )
}
