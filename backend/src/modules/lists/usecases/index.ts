import type { ProfileRepo } from '../../profile/repository'
import type { ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../../wallet/repository'
import type { ListRepo } from '../repository'
import { addExtraItem } from './add-extra-item'
import { addItem } from './add-item'
import { createList } from './create-list'
import { deleteItem } from './delete-item'
import { finishShopping } from './finish-shopping'
import { fixHistoryItem } from './fix-history-item'
import { getCurrentList } from './get-current-list'
import { listHistory } from './list-history'
import { purchaseItem } from './purchase-item'
import { renameItem } from './rename-item'
import { startShopping } from './start-shopping'
import { updateBudget } from './update-budget'

export type ListUsecaseDeps = {
  lists: ListRepo
  profiles: ProfileRepo
  wallets: WalletRepo
  shop: ShopRepo
  clock: () => Date
}

/** routes.ts に渡す use-case の束。依存をここで 1 回だけ渡す */
export const createListUsecases = (d: ListUsecaseDeps) => ({
  createList: createList(d),
  getCurrentList: getCurrentList(d),
  updateBudget: updateBudget(d),
  addItem: addItem(d),
  renameItem: renameItem(d),
  deleteItem: deleteItem(d),
  startShopping: startShopping(d),
  purchaseItem: purchaseItem(d),
  addExtraItem: addExtraItem(d),
  finishShopping: finishShopping(d),
  listHistory: listHistory(d),
  fixHistoryItem: fixHistoryItem(d),
})
