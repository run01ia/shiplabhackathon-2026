import { Button } from '~/components/Button'
import { useStockPantry } from '../hooks/useStockPantry'

/** 結果画面の入口。買ったものを、ワンタップで家の在庫に入れる (買ったものがなければ出さない) */
export function StockPantryButton({ names }: { names: string[] }) {
  const { state, stock } = useStockPantry(names)
  if (names.length === 0) return null
  if (state === 'done') {
    return (
      <p className="mb-3 text-center text-sm" role="status">
        買ったもの {names.length} 個を家の在庫に入れたよ。次のリストで「家にあるよ」と教えるね
      </p>
    )
  }
  return (
    <>
      <Button variant="sub" disabled={state === 'saving'} onClick={stock}>
        買ったもの {names.length} 個を家の在庫に入れる
      </Button>
      {state === 'error' ? (
        <p className="mb-3 text-center text-sm text-red" role="alert">
          うまく入れられなかった…もう一度ためしてね
        </p>
      ) : null}
    </>
  )
}
