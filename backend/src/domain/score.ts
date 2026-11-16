// 買い物上手スコアの計算 (骨組み)。配点は仮置き。仕様確定後に調整する
export type ShoppingResult = {
  budget: number
  spent: number
  unnecessaryCount: number
}

export const calcShoppingScore = (r: ShoppingResult): number => {
  const budgetPoint = r.spent <= r.budget ? 10 : -10
  return budgetPoint - r.unnecessaryCount * 5
}
