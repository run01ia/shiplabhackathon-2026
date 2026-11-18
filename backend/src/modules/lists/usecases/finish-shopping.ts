import { toJstDate } from '../../../shared/domain/date'
import { AppError } from '../../../shared/errors'
import type { ProfileRepo } from '../../profile/repository'
import { judgeReceipt, type ReceiptRepo } from '../../receipts/repository'
import type { Drop, ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../../wallet/repository'
import { judgeShopping, limitToDaily } from '../domain/score'
import type { ListRepo } from '../repository'
import { getShoppingList, sumSpent } from './guards'

type Deps = {
  lists: ListRepo
  // 他モジュールは port (interface) の必要なメソッドだけを受け取る。実装は deps.ts が渡す
  profiles: Pick<ProfileRepo, 'claimShoppingReward'>
  wallets: Pick<WalletRepo, 'addPointsBatch'>
  shop: Pick<ShopRepo, 'rollDrop'>
  receipts: Pick<ReceiptRepo, 'getCompleted' | 'claimReward'>
  clock: () => Date
}

/**
 * 買い物を終える。結果を判定し、内訳ごとにポイントを付与する。
 * scanId (レシートの読み取り) があれば、リスト外の品目を不要買いとして数え、お菓子のボーナスを内訳に足す
 */
export const finishShopping =
  (d: Deps) => async (userId: string, listId: string, spentAmount?: number, scanId?: string) => {
    const list = await getShoppingList(d.lists, userId, listId)
    const items = await d.lists.listItems(listId)
    // 使えるのは、本人の・このリストの・完了した読み取りだけ。違えば 400 (買い物は終えない。scanId なしでやり直せる)
    const scan = scanId ? await d.receipts.getCompleted(userId, listId, scanId) : null
    if (scanId && !scan) throw new AppError('bad_request', 'このレシートの読み取りは使えません')
    const receipt = scan && judgeReceipt(scan.items)
    const receiptTotal = receipt && Math.max(scan?.total ?? receipt.itemsTotal, 0)
    const spent = spentAmount ?? receiptTotal ?? sumSpent(items)
    // 状態の確認と更新を 1 回の条件付き update で行い、同時の二重送信でポイントが 2 回付かないようにする
    // (読み取りはこのリストのものだけなので、1 つの読み取りが 2 回の判定に使われることもない)
    const finished = await d.lists.finishIfShopping(listId, spent, d.clock().toISOString())
    if (!finished) throw new AppError('conflict', 'この買い物はすでに終わっています')
    // 買い物の判定日を記録する (「買い物に行かなかった日」の判定にも使う)。
    // ごほうび (プラスとおみやげ) は 1 日 1 回。2 回目以降はマイナスだけ反映する
    const firstToday = await d.profiles.claimShoppingReward(userId, toJstDate(d.clock()))
    const bought = items.some((i) => i.isChecked)
    // レシートのボーナスは、今日はじめての・1 件以上買った買い物だけ。さらに読み取り側の 1 日 1 回 (rewarded) も取る。
    // 買い物はもう終わっているので、ここの失敗では止めない (ボーナスなしで続ける)
    const candidate = receipt?.bonus ?? null
    const claimed =
      candidate !== null &&
      scanId !== undefined &&
      firstToday &&
      bought &&
      (await d.receipts.claimReward(scanId, candidate.points).catch((e: unknown) => {
        console.error('claimReward failed', e instanceof Error ? e.name : 'unknown')
        return false
      }))
    const offList = scan ? scan.items.filter((i) => i.onList === false) : []
    const raw = judgeShopping({
      budget: list.budget,
      spent,
      items,
      receipt: scan
        ? { offListCount: offList.length, bonus: claimed ? candidate : null }
        : undefined,
    })
    const judgement = limitToDaily(raw, firstToday)
    // 内訳をまとめて 1 回で付ける (途中で失敗して半分だけ付くことがない)。ペットの経験値とレベルも一緒に変わる
    const { growth, levelUp } = await d.wallets.addPointsBatch(
      userId,
      judgement.breakdown.map((line) => ({ delta: line.points, reason: line.label })),
    )
    // おみやげ: 予算内で、1 件以上買ったときだけ (D28 と同じ条件。作成 → 終了の繰り返しで集められない)
    const earned = firstToday && judgement.withinBudget && bought
    // 買い物はもう終わっているので、おみやげの失敗で結果を返せなくしない
    const drop: Drop | null = earned
      ? await d.shop.rollDrop(userId).catch((e: unknown) => {
          console.error('rollDrop failed', e)
          return null
        })
      : null
    return {
      list: finished,
      items,
      ...judgement,
      /** レシートで判定したとき: リスト外だった品目名。手入力の判定なら null */
      receipt: scan ? { offList: offList.map((i) => i.name) } : null,
      drop,
      rewardedToday: firstToday,
      growth,
      levelUp,
    }
  }
