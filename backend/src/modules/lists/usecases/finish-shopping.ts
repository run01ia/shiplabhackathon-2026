import { toJstDate } from '../../../shared/domain/date'
import { AppError } from '../../../shared/errors'
import type { ProfileRepo } from '../../profile/repository'
import type { Drop, ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../../wallet/repository'
import { judgeShopping, limitToDaily } from '../domain/score'
import type { ListRepo } from '../repository'
import { getShoppingList, sumSpent } from './guards'

type Deps = {
  lists: ListRepo
  // 他モジュールは port (interface) の必要なメソッドだけを受け取る。実装は deps.ts が渡す
  profiles: Pick<ProfileRepo, 'claimShoppingReward'>
  wallets: Pick<WalletRepo, 'addPoints'>
  shop: Pick<ShopRepo, 'rollDrop'>
  clock: () => Date
}

/** 買い物を終える。結果を判定し、内訳ごとにポイントを付与する */
export const finishShopping =
  (d: Deps) => async (userId: string, listId: string, spentAmount?: number) => {
    const list = await getShoppingList(d.lists, userId, listId)
    const items = await d.lists.listItems(listId)
    const spent = spentAmount ?? sumSpent(items)
    const raw = judgeShopping({ budget: list.budget, spent, items })
    // 状態の確認と更新を 1 回の条件付き update で行い、同時の二重送信でポイントが 2 回付かないようにする
    const finished = await d.lists.finishIfShopping(listId, spent, d.clock().toISOString())
    if (!finished) throw new AppError('conflict', 'この買い物はすでに終わっています')
    // 買い物の判定日を記録する (「買い物に行かなかった日」の判定にも使う)。
    // ごほうび (プラスとおみやげ) は 1 日 1 回。2 回目以降はマイナスだけ反映する
    const firstToday = await d.profiles.claimShoppingReward(userId, toJstDate(d.clock()))
    const judgement = limitToDaily(raw, firstToday)
    for (const line of judgement.breakdown) {
      await d.wallets.addPoints(userId, line.points, line.label)
    }
    // おみやげ: 予算内で、1 件以上買ったときだけ (D28 と同じ条件。作成 → 終了の繰り返しで集められない)
    const earned = firstToday && judgement.withinBudget && items.some((i) => i.isChecked)
    // 買い物はもう終わっているので、おみやげの失敗で結果を返せなくしない
    const drop: Drop | null = earned
      ? await d.shop.rollDrop(userId).catch((e: unknown) => {
          console.error('rollDrop failed', e)
          return null
        })
      : null
    return { list: finished, items, ...judgement, drop, rewardedToday: firstToday }
  }
