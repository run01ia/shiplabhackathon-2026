// shop モジュールの port。他モジュールからは型 (interface) だけを import してよい
import type { Wallet } from '../wallet/repository'
import type { DropPick, Rarity } from './domain/drop'

export type { Rarity }

export type ShopItem = {
  key: string
  name: string
  price: number
  /** null = ショップで買える。値あり = おみやげ (ドロップ) 限定で、買えない */
  rarity: Rarity | null
  owned: boolean
  equipped: boolean
}

export type BuyResult =
  | { ok: true; wallet: Wallet }
  | { ok: false; reason: 'item_not_found' | 'already_owned' | 'insufficient_coins' }

export type EquipResult = 'ok' | 'item_not_found' | 'not_owned'

/** おみやげ。帽子か、帽子を出せないときのコイン */
export type Drop = { key: string; name: string; rarity: Rarity } | { coins: number }

/**
 * おみやげの決め方。規則は domain/drop.ts にあり、deps.ts が乱数と一緒に組み立てて infra に渡す
 * (infra は domain を import しない)。pick が null なら、coins だけコインを足す
 */
export type DropPolicy = {
  pick: (items: readonly ShopItem[]) => DropPick | null
  coins: number
}

export interface ShopRepo {
  /** マスタ + 所持 + 着用 */
  listItems(userId: string): Promise<ShopItem[]>
  /** コイン減算と所持追加を 1 トランザクションで行う */
  buy(userId: string, itemKey: string): Promise<BuyResult>
  /** おみやげを決め (DropPolicy)、帽子の所持追加かコイン加算を 1 トランザクションで行う */
  rollDrop(userId: string): Promise<Drop>
  setEquipped(userId: string, itemKey: string, equipped: boolean): Promise<EquipResult>
}
