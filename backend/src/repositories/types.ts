// service が依存するのはこの interface だけ。DB の列名 (snake_case) はここに出さない
export type Profile = {
  id: string
  petName: string
  lastLoginRewardOn: string | null
}

export type Wallet = {
  coins: number
  score: number
  level: number
  exp: number
}

export type ListStatus = 'planning' | 'shopping' | 'finished'

export type List = {
  id: string
  userId: string
  budget: number
  status: ListStatus
  spentAmount: number | null
  createdAt: string
  finishedAt: string | null
}

export type ListItem = {
  id: string
  listId: string
  name: string
  /** 円。null = 未入力 (購入済みにするとき入れる) */
  price: number | null
  isChecked: boolean
  isExtra: boolean
  isUnnecessary: boolean
}

export type NewItem = Pick<ListItem, 'name' | 'price' | 'isChecked' | 'isExtra' | 'isUnnecessary'>
export type ItemPatch = Partial<Pick<ListItem, 'name' | 'price' | 'isChecked' | 'isUnnecessary'>>
export type ListPatch = Partial<Pick<List, 'budget' | 'status' | 'spentAmount' | 'finishedAt'>>
export type FinishedList = { list: List; items: ListItem[] }

export interface ProfileRepo {
  get(userId: string): Promise<Profile | null>
}

export interface ListRepo {
  /** 進行中 (finished 以外) のリスト。なければ null */
  getActive(userId: string): Promise<List | null>
  /** 本人のリスト。他人・存在しないなら null */
  getOwned(userId: string, listId: string): Promise<List | null>
  create(userId: string, budget: number, now: Date): Promise<List>
  update(listId: string, patch: ListPatch): Promise<List>
  listItems(listId: string): Promise<ListItem[]>
  addItem(listId: string, item: NewItem): Promise<ListItem>
  getItem(listId: string, itemId: string): Promise<ListItem | null>
  updateItem(itemId: string, patch: ItemPatch): Promise<ListItem>
  deleteItem(itemId: string): Promise<void>
  /** 完了したリストと品目。finishedAt の新しい順 */
  listFinished(userId: string, limit: number): Promise<FinishedList[]>
  /** 完了したリストの品目 (本人のものだけ)。なければ null */
  getFinishedItem(userId: string, itemId: string): Promise<ListItem | null>
}

export interface WalletRepo {
  get(userId: string): Promise<Wallet | null>
  save(userId: string, wallet: Wallet): Promise<void>
  /** ポイントを増減し、履歴 (理由つき) を残す */
  addPoints(userId: string, delta: number, reason: string): Promise<void>
}

export type Repositories = {
  profiles: ProfileRepo
  lists: ListRepo
  wallets: WalletRepo
}
