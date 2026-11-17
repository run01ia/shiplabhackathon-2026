// pantry モジュールの port。家にあるもの (在庫)。数量は持たず、「ある / 少ない」だけ
export type PantryStatus = 'have' | 'low'

export type PantryItem = {
  id: string
  name: string
  /** 比較用のキー (domain/name.ts の nameKey)。同じキーは 1 人 1 行 */
  key: string
  status: PantryStatus
  /** 最後に在庫に入れた日時 (ISO) */
  stockedAt: string
}

export type PantryEntry = Pick<PantryItem, 'name' | 'key'>

export interface PantryRepo {
  /** 本人の在庫。入れた日時の新しい順 */
  list(userId: string): Promise<PantryItem[]>
  /** まとめて入れる。同じキーがあれば、名前・日時を更新して「ある」に戻す */
  upsertMany(userId: string, entries: PantryEntry[], stockedAt: string): Promise<void>
  /** 本人の在庫の状態を変える。なければ null */
  setStatus(userId: string, id: string, status: PantryStatus): Promise<PantryItem | null>
  /** 本人の在庫を消す。なければ false */
  remove(userId: string, id: string): Promise<boolean>
}
