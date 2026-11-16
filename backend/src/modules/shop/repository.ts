// shop モジュールの port。他モジュールからは型 (interface) だけを import してよい
import type { Wallet } from '../wallet/repository'

export type ShopItem = {
  key: string
  name: string
  price: number
  owned: boolean
  equipped: boolean
}

export type BuyResult =
  | { ok: true; wallet: Wallet }
  | { ok: false; reason: 'item_not_found' | 'already_owned' | 'insufficient_coins' }

export type EquipResult = 'ok' | 'item_not_found' | 'not_owned'

export interface ShopRepo {
  /** マスタ + 所持 + 着用 */
  listItems(userId: string): Promise<ShopItem[]>
  /** コイン減算と所持追加を 1 トランザクションで行う */
  buy(userId: string, itemKey: string): Promise<BuyResult>
  setEquipped(userId: string, itemKey: string, equipped: boolean): Promise<EquipResult>
}
