import { Card } from '~/components/Card'
import { formatDateTime } from '../logic/format'
import type { PointLog } from '../types'

/** ポイント履歴 (日時・理由・増減) */
export function PointLogList({ logs }: { logs: PointLog[] }) {
  if (logs.length === 0) return <p className="text-sm text-muted">まだポイントの履歴がありません</p>
  return (
    <Card className="px-3.5 py-1">
      {logs.map((r) => (
        <div
          key={r.id}
          className="flex justify-between gap-2 border-b-2 border-dashed border-gray py-2.5 last:border-0"
        >
          <div>
            <span className="block text-xs font-normal text-muted">
              {formatDateTime(r.createdAt)}
            </span>
            {r.reason}
          </div>
          <b className={r.delta < 0 ? 'text-red' : 'text-mint'}>
            {r.delta > 0 ? '+' : ''}
            {r.delta}
          </b>
        </div>
      ))}
    </Card>
  )
}
