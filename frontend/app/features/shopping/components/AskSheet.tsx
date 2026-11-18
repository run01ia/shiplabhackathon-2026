import type { FormEvent } from 'react'
import { BottomSheet } from '~/components/BottomSheet'
import { Button } from '~/components/Button'
import { ScreenTitle } from '~/components/Screen'
import { Field } from './Field'

type Props = {
  open: boolean
  onClose: () => void
  onBuy: (name: string) => void
  /** 「やめておく」を押した (がまんできた) */
  onSkip: () => void
}

/** リスト外のものを買う前の確認 (品名だけ)。「やめておく」はほめて閉じる (+5 は結果画面で付く) */
export function AskSheet({ open, onClose, onBuy, onSkip }: Props) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = String(new FormData(e.currentTarget).get('name') ?? '').trim()
    if (name) onBuy(name)
  }
  return (
    <BottomSheet open={open} onClose={onClose}>
      <ScreenTitle>ほんとうに必要？</ScreenTitle>
      <form onSubmit={submit}>
        <Field name="name" placeholder="なにを買う？" aria-label="品名" required />
        <Button variant="mint" onClick={onSkip}>
          やめておく +5
        </Button>
        <Button type="submit" variant="sub">
          それでも買う −15
        </Button>
      </form>
    </BottomSheet>
  )
}
