import type { ShopRepo } from '../repository'
import { buyItem } from './buy-item'
import { equipItem } from './equip-item'
import { listShopItems } from './list-shop-items'

export type ShopUsecaseDeps = { shop: ShopRepo }

/** routes.ts に渡す use-case の束。依存をここで 1 回だけ渡す */
export const createShopUsecases = (d: ShopUsecaseDeps) => ({
  listShopItems: listShopItems(d),
  buyItem: buyItem(d),
  equipItem: equipItem(d),
})
