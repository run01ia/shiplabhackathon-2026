import { Card } from '~/components/Card'
import { formatDateTime } from '../logic/format'
import type { PointLog } from '../types'

/** ポイント履歴 (日時・理由・増減)。ショップでの購入は、罰ではないので赤にせずコインの印で出す */
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
          {r.kind === 'coin' ? (
            <b className="flex items-center gap-1 whitespace-nowrap text-ink">
              <span
                aria-hidden
                className="inline-block size-4 rounded-full border-2 border-ink bg-sun"
              />
              {r.delta}
              <span className="sr-only">コイン</span>
            </b>
          ) : (
            <b className={r.delta < 0 ? 'text-red' : 'text-mint'}>
              {r.delta > 0 ? '+' : ''}
              {r.delta}
            </b>
          )}
        </div>
      ))}
    </Card>
  )
}
