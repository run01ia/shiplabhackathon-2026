# API 仕様

API の正は `backend/src/modules/*/routes.ts` (パス) と `schemas.ts` (入力) です。このページが API のドキュメントの最新版です。
下の JSON 例は、メモリ実装 (`createMemoryDeps`) で実際に呼んだ結果をもとにしています (id と日時は例)。

- ローカルの URL: `http://localhost:3000`
- 金額は円の整数、コインとポイントは整数です。日付の判定は日本時間 (JST) です。
- CORS (ほかの URL からの呼び出しの許可) は、今は `http://localhost:5173` だけを許しています (`backend/src/app.ts`)。

## 認証ヘッダーの付け方

`/health` 以外は、すべてログインが必要です。Supabase Auth のアクセストークンを付けます。

```
Authorization: Bearer <アクセストークン>
```

- frontend では `frontend/app/lib/session.ts` の `requireAccessToken()` でトークンを取り、`createApi(token)` に渡せば自動で付きます。
- トークンがない、または無効なときは `401` が返ります。
- DB なし (メモリ実装) で backend を起動したときは、`Bearer test-<好きなID>` をそのままユーザーとして扱います (例: `Bearer test-u1`)。

## エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/health` | 動いているかの確認。`{ "ok": true }` | 不要 |
| GET | `/me` | 自分の状態 (ペット名、コイン、スコア、レベル、経験値、着用中のアイテム) | 必要 |
| POST | `/rewards/login` | ログイン報酬を受け取る。1 日 1 回 (JST)。2 回目以降は何も付与しない | 必要 |
| GET | `/shop/items` | 着せ替えアイテムの一覧 (所持・着用つき) | 必要 |
| POST | `/shop/items/:key/buy` | アイテムを買う (コインを減らして所持に足す) | 必要 |
| PATCH | `/shop/items/:key/equip` | アイテムを着る / 外す。body `{ "equipped": boolean }` | 必要 |
| GET | `/history/points` | ポイントの増減の履歴 (新しい順、最大 50) | 必要 |
| POST | `/lists` | リストを作る。body `{ "budget"?: number }` (既定 0) | 必要 |
| GET | `/lists/current` | 完了していないリスト (品目つき) | 必要 |
| PATCH | `/lists/:id` | 予算を変える。body `{ "budget": number }` | 必要 |
| POST | `/lists/:id/items` | 品目を足す。body `{ "name": string }` | 必要 |
| PATCH | `/lists/:id/items/:itemId` | 品目の名前を変える。body `{ "name": string }` | 必要 |
| DELETE | `/lists/:id/items/:itemId` | 品目を消す。`204` (本文なし) | 必要 |
| POST | `/lists/:id/start` | 買い物を始める (`planning` → `shopping`) | 必要 |
| PATCH | `/lists/:id/items/:itemId/purchase` | 品目を買った (購入済みにし、金額を入れる)。body `{ "price": number }` | 必要 |
| POST | `/lists/:id/extra-items` | リスト外の品目を、購入済みで足す。body `{ "name", "price", "isUnnecessary"?: boolean }` | 必要 |
| POST | `/lists/:id/finish` | 買い物を終える。結果を判定し、ポイントを付ける。body `{ "spentAmount"?: number }` | 必要 |
| GET | `/history/lists` | 完了したリストと品目 (新しい順、最大 50) | 必要 |
| PATCH | `/history/items/:itemId` | 完了したリストの品目の金額・不要の印を直す。body `{ "price"?, "isUnnecessary"? }` (どちらか必須)。ポイントは計算し直さない | 必要 |

入力のルール (`schemas.ts`):

- 金額 (`budget` `price` `spentAmount`) は 0 〜 10,000,000 の整数。
- 品目名 (`name`) は前後の空白を除いて 1 〜 100 文字。
- アイテムの `key` は英小文字・数字・`_` だけ。

状態のルール (`usecases/guards.ts`):

- 他人のリスト・品目は `404` (存在しないのと同じ扱い)。
- 予算の変更、品目の追加・名前変更・削除は、`finished` 以外のときだけ。`finished` なら `409`。
- `purchase`、`extra-items`、`finish` は `shopping` のときだけ。それ以外は `409`。
- 完了していないリストがあるときに `POST /lists` すると `409`。

## リクエストとレスポンスの例

### `GET /me`

```json
{ "petName": "ぷち", "coins": 0, "score": 0, "level": 1, "exp": 0, "equippedItems": [] }
```

`equippedItems` は着用中のアイテムの `key` の配列です (例: `["hat"]`)。

### `POST /rewards/login`

その日の初回:

```json
{
  "granted": true,
  "rewards": [
    { "reason": "ログインボーナス", "delta": 20 },
    { "reason": "買い物に行かなかった日", "delta": 30 }
  ],
  "total": 50,
  "coins": 50,
  "score": 50
}
```

- 「買い物に行かなかった日」は、その日にまだ買い物を終えていないときに付きます。
- 同じ日の 2 回目以降は `"granted": false`、`"rewards": []`、`"total": 0` です。

### `POST /lists`

リクエスト: `{ "budget": 1000 }` → `201`

```json
{
  "list": {
    "id": "14659fe8-...",
    "userId": "u1",
    "budget": 1000,
    "status": "planning",
    "spentAmount": null,
    "createdAt": "2026-11-16T12:26:12.384Z",
    "finishedAt": null
  },
  "items": [],
  "spent": 0,
  "remaining": 1000
}
```

この形 (`list` + `items` + `spent` + `remaining`) を、このページでは **detail** と呼びます。
`GET /lists/current`、`PATCH /lists/:id`、`start`、`purchase`、`extra-items` も detail を返します。

- `spent`: 購入済みの品目の金額の合計
- `remaining`: `budget - spent` (超えるとマイナス)

### `POST /lists/:id/items`

リクエスト: `{ "name": "牛乳" }` → `201` (品目だけを返す)

```json
{
  "id": "7eff03f6-...",
  "listId": "14659fe8-...",
  "name": "牛乳",
  "price": null,
  "isChecked": false,
  "isExtra": false,
  "isUnnecessary": false
}
```

### `PATCH /lists/:id/items/:itemId/purchase`

リクエスト: `{ "price": 200 }` → detail (品目が `"isChecked": true, "price": 200` になり、`"spent": 200, "remaining": 800`)

### `POST /lists/:id/finish`

リクエスト: `{}` (`spentAmount` を省くと、購入済みの合計を支出にする)

```json
{
  "list": { "id": "14659fe8-...", "status": "finished", "spentAmount": 200, "finishedAt": "2026-11-16T12:26:12.385Z", "...": "..." },
  "items": [{ "id": "7eff03f6-...", "name": "牛乳", "price": 200, "isChecked": true, "...": "..." }],
  "withinBudget": true,
  "remaining": 800,
  "unnecessaryCount": 0,
  "completionRate": 1,
  "asPlanned": true,
  "breakdown": [
    { "label": "予算内", "points": 30 },
    { "label": "リスト通り", "points": 10 },
    { "label": "不要買いをやめた", "points": 5 }
  ],
  "total": 45,
  "drop": { "key": "straw", "name": "むぎわらぼうし", "rarity": "common" }
}
```

- 予算ちょうどは「予算内」です。
- `drop` (おみやげ): 予算内で、1 件以上買ったときだけ入ります。帽子なら `{ key, name, rarity }` (`rarity` は `common` ふつう 70% / `rare` レア 25% / `epic` 激レア 5%)、帽子を出せないときは `{ "coins": 10 }`、条件を満たさなければ `null`。まだ持っていない帽子から選び、そのレア度を全部持っていたら下のレア度へ、下にもなければコインです (規則は `backend/src/modules/shop/domain/drop.ts`)。
- `completionRate`: リスト外を除く品目のうち、購入済みの割合 (0〜1)。
- `asPlanned`: リストの品目をすべて買い、リスト外の購入がないとき `true`。
- `breakdown` の 1 行ごとに、ポイントの履歴 (`point_logs`) に 1 行残ります。
- 配点は `backend/src/modules/lists/domain/score.ts` の `POINTS` (仮の値): 予算内 +30、リスト通り +10、不要買いなし +5、予算超過 -20、不要買い 1 件ごとに -15。何も買っていない買い物はポイントなし (D28)。

### `GET /shop/items`

```json
[
  { "key": "hat", "name": "ぼうし", "price": 30, "rarity": null, "owned": false, "equipped": false },
  { "key": "straw", "name": "むぎわらぼうし", "price": 0, "rarity": "common", "owned": true, "equipped": false }
]
```

`rarity` が `null` でないアイテムは、おみやげ限定です (買えません。`buy` は `404`)。持っていれば着られます。

### `POST /shop/items/:key/buy`

レスポンス: `{ "coins": 65 }` (買ったあとの残り)。コイン不足・所持済みは `400`、存在しない `key` は `404`。

### `PATCH /shop/items/:key/equip`

リクエスト: `{ "equipped": true }` → `{ "key": "hat", "equipped": true }`。持っていないアイテムは `400`、存在しない `key` は `404`。

### `GET /history/points`

```json
[
  { "id": "2e32389c-...", "delta": 5, "reason": "不要買いをやめた", "createdAt": "2026-11-16T12:26:12.385Z" },
  { "id": "6f842712-...", "delta": 20, "reason": "ログインボーナス", "createdAt": "2026-11-16T12:26:12.383Z" }
]
```

### `GET /history/lists`

```json
{ "lists": [{ "list": { "...": "status=finished" }, "items": [] }] }
```

## エラーの形

エラーは 2 つの形があります。

**1. 入力の検証エラー (`400`)**: `zValidator` (zod) が返します。

```json
{
  "success": false,
  "error": { "name": "ZodError", "message": "[ { \"code\": \"too_small\", \"path\": [\"budget\"], ... } ]" }
}
```

**2. それ以外のエラー**: `backend/src/shared/middleware/error.ts` が返します。

```json
{ "error": "list not found" }
```

| ステータス | いつ |
|---|---|
| `400` | 入力が不正 (上の 1)、またはコイン不足・所持済み・未所持 |
| `401` | トークンがない (`unauthorized`)、無効 (`invalid token`) |
| `404` | 見つからない、または他人のもの |
| `409` | 今の状態ではできない (例: 買い物中でないのに `finish`) |
| `500` | 想定外のエラー (`internal server error`。詳細は返さない) |

use-case は `AppError('not_found' | 'conflict' | 'bad_request', メッセージ)` を投げ、middleware が `404` / `409` / `400` に変えます (`backend/src/shared/errors.ts`)。

## frontend からの呼び方 (Hono RPC)

**Hono RPC** は、backend の型 (`AppType`) を frontend で読み込み、API を関数のように型付きで呼べる仕組みです。
パスや body を間違えると、型エラーになります。

```ts
// frontend/app/features/shopping/api.ts (抜粋)
import { createApi, unwrap } from '~/lib/api'

/** POST /lists/:id/start */
export const startShopping = async (accessToken: string, id: string) =>
  unwrap(await createApi(accessToken).lists[':id'].start.$post({ param: { id } }))
```

- パスの `/lists/:id/start` は、`.lists[':id'].start` のように書きます。`:id` の値は `param` で渡します。
- body は `json: { ... }` で渡します (例: `.items[':itemId'].purchase.$patch({ param: { id, itemId }, json: { price } })`)。
- `unwrap()` (`frontend/app/lib/api.ts`) は、失敗 (`!res.ok`) なら例外を投げ、成功なら JSON を返します。
- `404` や `409` は middleware が返すため、型には出てきません。`404` を見たいときは `(res.status as number) === 404` のように比べます (`fetchCurrentList` を参照)。
- frontend は backend の型だけを読み込みます (`import type { AppType } from '@backend/app'`)。backend のコードは frontend に入りません。

## API を足すとき

1. `backend/src/modules/<機能>/schemas.ts` に入力の zod スキーマを足す。
2. `backend/src/modules/<機能>/usecases/<操作>.ts` に処理を書き、`usecases/index.ts` で束ねる。
3. `backend/src/modules/<機能>/routes.ts` のチェーンに `.post('/パス', zValidator('json', スキーマ), async (c) => c.json(await u.xxx(...)))` を足す。
4. 確認: DB なし (メモリ実装) で backend を起動し、`curl -H 'Authorization: Bearer test-u1' http://localhost:3000/パス` で呼ぶ ([setup.md](./setup.md#db-なしで-backend-だけ動かす))。
5. このページの表を更新する。
