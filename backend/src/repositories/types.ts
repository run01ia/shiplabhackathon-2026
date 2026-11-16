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
}

export interface ProfileRepo {
  get(userId: string): Promise<Profile | null>
}

export interface ListRepo {
  /** 進行中 (finished 以外) のリスト。なければ null */
  getActive(userId: string): Promise<List | null>
}

export interface WalletRepo {
  get(userId: string): Promise<Wallet | null>
  save(userId: string, wallet: Wallet): Promise<void>
}

export type Repositories = {
  profiles: ProfileRepo
  lists: ListRepo
  wallets: WalletRepo
}
