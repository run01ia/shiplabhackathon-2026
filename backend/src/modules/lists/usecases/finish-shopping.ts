import { judgeShopping, toJstDate } from '../../../domain'
import type { ProfileRepo } from '../../profile/repository'
import type { WalletRepo } from '../../wallet/repository'
import type { ListRepo } from '../repository'
import { getShoppingList, sumSpent } from './guards'

type Deps = {
  lists: ListRepo
  // 他モジュールは port (interface) の必要なメソッドだけを受け取る。実装は deps.ts が渡す
  profiles: Pick<ProfileRepo, 'markShoppingJudged'>
  wallets: Pick<WalletRepo, 'addPoints'>
  clock: () => Date
}

/** 買い物を終える。結果を判定し、内訳ごとにポイントを付与する */
export const finishShopping =
  (d: Deps) => async (userId: string, listId: string, spentAmount?: number) => {
    const list = await getShoppingList(d.lists, userId, listId)
    const items = await d.lists.listItems(listId)
    const spent = spentAmount ?? sumSpent(items)
    const judgement = judgeShopping({ budget: list.budget, spent, items })
    const finished = await d.lists.update(listId, {
      status: 'finished',
      spentAmount: spent,
      finishedAt: d.clock().toISOString(),
    })
    // 買い物の判定日を記録する (ログイン報酬の「買い物に行かなかった日」の判定に使う)
    await d.profiles.markShoppingJudged(userId, toJstDate(d.clock()))
    for (const line of judgement.breakdown) {
      await d.wallets.addPoints(userId, line.points, line.label)
    }
    return { list: finished, items, ...judgement }
  }
