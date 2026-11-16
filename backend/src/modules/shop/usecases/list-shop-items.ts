import type { ShopRepo } from '../repository'

/** 着せ替えアイテムの一覧 (所持・着用つき) */
export const listShopItems = (d: { shop: Pick<ShopRepo, 'listItems'> }) => (userId: string) =>
  d.shop.listItems(userId)
