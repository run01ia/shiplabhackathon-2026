import { useEffect, useEffectEvent } from 'react'
import { useFetcher } from 'react-router'
import { slotConflicts } from '../accessories'
import type { ShopItem, ShopResult } from '../api'

/**
 * 購入と着用を、ルートの clientAction (runShopAction) に送る。
 * 終わると loader が読み直され、/me と /shop/items が新しくなる。結果は onResult に 1 回だけ届く。
 */
export const useShopActions = (
  equippedKeys: readonly string[],
  onResult: (result: ShopResult) => void,
) => {
  const fetcher = useFetcher<ShopResult>()
  const notify = useEffectEvent(onResult)

  useEffect(() => {
    if (fetcher.data) notify(fetcher.data)
  }, [fetcher.data])

  const send = (intent: ShopResult['intent'], item: ShopItem, equipped: boolean) =>
    fetcher.submit(
      {
        intent,
        key: item.key,
        equipped: String(equipped),
        unequip: slotConflicts(item.key, equippedKeys).join(','),
      },
      { method: 'post' },
    )

  return {
    busy: fetcher.state !== 'idle',
    buy: (item: ShopItem) => send('buy', item, true),
    /** 着ていれば外し、着ていなければ着る */
    toggle: (item: ShopItem) => send('equip', item, !item.equipped),
  }
}
