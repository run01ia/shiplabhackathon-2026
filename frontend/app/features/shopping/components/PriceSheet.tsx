import type { FormEvent } from 'react'
import { BottomSheet } from '~/components/BottomSheet'
import { Button } from '~/components/Button'
import { ScreenTitle } from '~/components/Screen'
import { parseYen } from '../logic/yen'
import type { ListItem } from '../types'
import { Field } from './Field'

type Props = { item: ListItem | null; onClose: () => void; onSubmit: (price: number) => void }

/** 品目を購入済みにして金額を入れる */
export function PriceSheet({ item, onClose, onSubmit }: Props) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const price = parseYen(String(new FormData(e.currentTarget).get('price') ?? ''))
    if (price === null) return
    onSubmit(price)
  }
  return (
    <BottomSheet open={item !== null} onClose={onClose}>
      <ScreenTitle>{item?.name}</ScreenTitle>
      <form onSubmit={submit}>
        <Field
          key={item?.id}
          autoFocus
          name="price"
          inputMode="numeric"
          placeholder="¥ いくら？"
          defaultValue={item?.price ?? ''}
          aria-label="金額"
          required
        />
        <Button type="submit" variant="mint">
          かごに入れた
        </Button>
      </form>
    </BottomSheet>
  )
}
