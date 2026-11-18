import { type ChangeEvent, useRef } from 'react'
import { Button } from '~/components/Button'

type Props = {
  /** 今日の残り回数。0 なら押せない */
  remaining: number
  /** 前回の失敗 (回数の上限、画像でない、読めなかった) */
  error?: string
  onPick: (file: File) => void
}

/** 「レシートを読む」の主ボタン。スマホではカメラ、PC ではファイル選択が開く */
export function ReceiptPicker({ remaining, error, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 同じ写真をもう一度選べるように空にする
    e.target.value = ''
    if (file) onPick(file)
  }
  return (
    <>
      {error ? (
        <p className="mt-0 mb-2.5 text-center text-sm text-red" role="alert">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="レシートの写真"
        onChange={onChange}
      />
      <Button
        className="mb-1.5"
        disabled={remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        {error ? '📷 もう一度とる' : '📷 レシートを読む'}
      </Button>
      <p className="m-0 text-center text-xs font-normal text-muted">
        {remaining > 0
          ? `合計とリスト外の買い物を 自動で入れるよ (今日は あと ${remaining} 回)。写真は保存しないよ`
          : '今日はもう読めないよ。下に合計を入れてね'}
      </p>
    </>
  )
}
