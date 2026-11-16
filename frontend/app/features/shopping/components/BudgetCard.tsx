import { Card } from '~/components/Card'
import { ProgressBar } from '~/components/ProgressBar'
import { formatYen } from '../logic/yen'
import { ShoppingPet } from './ShoppingPet'

type Props = { budget: number; remaining: number }

export function BudgetCard({ budget, remaining }: Props) {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <ShoppingPet mood={remaining < 0 ? 'sad' : 'happy'} size={70} />
        <div className="flex-1">
          <div className="text-xs font-normal text-muted">のこり予算 (入力した金額を引きます)</div>
          <b className="text-[30px] tabular-nums">{formatYen(remaining)}</b>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar value={Math.max(0, remaining)} max={budget} />
      </div>
    </Card>
  )
}
