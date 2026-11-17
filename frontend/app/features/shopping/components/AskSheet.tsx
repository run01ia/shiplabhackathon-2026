import type { FormEvent } from 'react'
import { BottomSheet } from '~/components/BottomSheet'
import { Button } from '~/components/Button'
import { ScreenTitle } from '~/components/Screen'
import { parseYen } from '../logic/yen'
import { Field } from './Field'

type Props = {
  open: boolean
  onClose: () => void
  onBuy: (name: string, price: number) => void
  /** 「やめておく」を押した (がまんできた) */
  onSkip: () => void
}

/** リスト外のものを買う前の確認。「やめておく」はほめて閉じる (+5 は結果画面で付く) */
export function AskSheet({ open, onClose, onBuy, onSkip }: Props) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const price = parseYen(String(form.get('price') ?? ''))
    if (!name || price === null) return
    onBuy(name, price)
  }
  return (
    <BottomSheet open={open} onClose={onClose}>
      <ScreenTitle>ほんとうに必要？</ScreenTitle>
      <form onSubmit={submit}>
        <Field name="name" placeholder="なにを買う？" aria-label="品名" required />
        <Field
          name="price"
          inputMode="numeric"
          placeholder="¥ いくら？"
          aria-label="金額"
          required
        />
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
