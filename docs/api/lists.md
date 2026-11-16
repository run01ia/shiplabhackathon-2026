> 最新は [docs/guide/api.md](../guide/api.md)。

# API: 買い物リスト・買い物中・結果判定・履歴

REQ-002/003/004/005/014。全て `Authorization: Bearer <Supabase JWT>` が必要。他人のリスト・品目は 404。
状態: `planning` → `shopping` → `finished`。金額は円の整数。エラーは `{ "error": string }` (400 入力不正 / 401 / 404 / 409 状態不正)。

共通の `detail` = `{ list, items, spent, remaining }`。`spent` は購入済み品目の金額合計、`remaining = budget - spent`。
`list` = `{ id, userId, budget, status, spentAmount, createdAt, finishedAt }`、
`item` = `{ id, listId, name, price (null=未入力), isChecked, isExtra, isUnnecessary }`。

| メソッド パス | リクエスト (JSON) | レスポンス |
|---|---|---|
| `POST /lists` | `{ budget?: number }` (既定 0) | 201 `detail`。未完了のリストがあれば 409 |
| `GET /lists/current` | - | `detail`。未完了がなければ 404 |
| `PATCH /lists/:id` | `{ budget }` | `detail` |
| `POST /lists/:id/items` | `{ name }` | 201 `item` (金額なし) |
| `PATCH /lists/:id/items/:itemId` | `{ name }` | `item` |
| `DELETE /lists/:id/items/:itemId` | - | 204 |
| `POST /lists/:id/start` | - | `detail` (planning → shopping。それ以外は 409) |
| `PATCH /lists/:id/items/:itemId/purchase` | `{ price }` | `detail` (購入済みにして金額を入れる。shopping のみ) |
| `POST /lists/:id/extra-items` | `{ name, price, isUnnecessary?: boolean }` | 201 `detail` (リスト外。購入済みで追加。shopping のみ) |
| `POST /lists/:id/finish` | `{ spentAmount?: number }` (省略時は購入済みの合計) | 下記。shopping のみ |
| `GET /history/lists` | - | `{ lists: { list, items }[] }` 完了済み、新しい順、最大 50 |
| `PATCH /history/items/:itemId` | `{ price?, isUnnecessary? }` (どちらか必須) | `item`。完了したリストの品目のみ。**ポイントは再計算しない** |

品目の追加・編集・削除、予算変更は finished 以外で可 (finished は 409)。

## `POST /lists/:id/finish` のレスポンス

```json
{
  "list": { "...": "status=finished, spentAmount, finishedAt" },
  "items": [],
  "withinBudget": true,
  "remaining": 300,
  "unnecessaryCount": 0,
  "completionRate": 1,
  "asPlanned": true,
  "breakdown": [{ "label": "予算内", "points": 30 }, { "label": "リスト通り", "points": 10 }, { "label": "不要買いをやめた", "points": 5 }],
  "total": 45
}
```

- 予算ちょうどは予算内。`completionRate` はリスト外を除く品目の購入済み割合。`asPlanned` = 全て購入済みかつリスト外の購入なし。
- `breakdown` の各行ごとに `WalletRepo.addPoints(userId, points, label)` を呼ぶ (ポイント履歴に 1 行ずつ残る)。
- 配点は `backend/src/domain/score.ts` の `POINTS` (仮置き。#8 で確定): 予算内 +30、リスト通り +10、不要買いなし +5、予算超過 -20、不要買い 1 件ごとに -15。
