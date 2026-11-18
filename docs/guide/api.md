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
| GET | `/receipts/status` | レシートの AI 判定が使えるか (`enabled`) と、今日の残り回数。backend に `ANTHROPIC_API_KEY` がなければ `enabled: false` (画面はボタンを出さない) | 必要 |
| GET | `/pantry` | 家にあるもの (在庫、REQ-013)。入れた日時の新しい順 | 必要 |
| POST | `/pantry/items` | 在庫にまとめて入れる。body `{ "names": string[] }` (1〜50 個)。同じ品目は入れ直し (日時を更新して「ある」に戻す) | 必要 |
| POST | `/pantry/matches` | 品目名のうち、家にあるものを返す。body `{ "names": string[] }` | 必要 |
| PATCH | `/pantry/items/:id` | 「ある / 少ない」を変える。body `{ "status": "have" \| "low" }` | 必要 |
| DELETE | `/pantry/items/:id` | 在庫から消す (なくなった)。`204` (本文なし) | 必要 |
| POST | `/receipts/scan` | レシートの写真を読み、品目を分類して、ペットのひとことと小さなボーナスを返す。`multipart/form-data` (`image`, `listId`)。画像は保存しない | 必要 |
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
{
  "petName": "ぷち", "coins": 0, "score": 0, "level": 1, "exp": 0,
  "growth": { "level": 1, "exp": 0, "levelExp": 0, "nextLevelExp": 50 },
  "equippedItems": []
}
```

### ペットの育ち方 (`growth` と `levelUp`)

プラスのポイントは、そのまま経験値になります (マイナスでは減りません)。ポイントが付く応答 (`POST /rewards/login`、`listBonus`、`POST /lists/:id/finish`) と `GET /me` に、次が入ります。

- `growth`: `level`、`exp` (累計の経験値)、`levelExp` (今のレベルになってから貯めた量)、`nextLevelExp` (次のレベルに必要な量。最大レベルでは `0`)。ゲージは `levelExp / nextLevelExp` です。
- `levelUp` (ポイントが付く応答だけ): その付与でレベルが上がったら `{ "from": 1, "to": 2 }`、上がらなければ `null`。一度に 2 つ以上上がることもあります。
- 必要な経験値は Lv.1 → 2 が 50 で、以後 25 ずつ増えます (`backend/src/modules/wallet/domain/level.ts`。仮の値)。

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
  "score": 50,
  "growth": { "level": 2, "exp": 50, "levelExp": 0, "nextLevelExp": 75 },
  "levelUp": { "from": 1, "to": 2 }
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
- `listBonus` (`POST /lists` と `GET /lists/current` だけ): リストの作成・閲覧ポイント。JST で 1 日 1 回 `{ "delta": 10, "growth": { ... }, "levelUp": null }`、付かなければ `null`。point_logs に「リストを準備した」で残る。点数は `backend/src/modules/lists/domain/list-bonus.ts` の `LIST_BONUS` (仮の値)

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
    { "label": "予算を 80% おさえた", "points": 15 },
    { "label": "リスト通り", "points": 10 },
    { "label": "不要買いをやめた", "points": 5 }
  ],
  "total": 60,
  "drop": { "key": "straw", "name": "むぎわらぼうし", "rarity": "common" },
  "growth": { "level": 2, "exp": 105, "levelExp": 55, "nextLevelExp": 75 },
  "levelUp": null
}
```

- 予算ちょうどは「予算内」です。
- `drop` (おみやげ): 予算内で、1 件以上買ったときだけ入ります。帽子なら `{ key, name, rarity }` (`rarity` は `common` ふつう 70% / `rare` レア 25% / `epic` 激レア 5%)、帽子を出せないときは `{ "coins": 10 }`、条件を満たさなければ `null`。まだ持っていない帽子から選び、そのレア度を全部持っていたら下のレア度へ、下にもなければコインです (規則は `backend/src/modules/shop/domain/drop.ts`)。
- `completionRate`: リスト外を除く品目のうち、購入済みの割合 (0〜1)。
- `asPlanned`: リストの品目をすべて買い、リスト外の購入がないとき `true`。
- `breakdown` の 1 行ごとに、ポイントの履歴 (`point_logs`) に 1 行残ります。
- 配点は `backend/src/modules/lists/domain/score.ts` の `POINTS` (仮の値): 予算内 +30、節約 (予算をおさえた割合 10% ごとに +3、最大 +15。リストを全部買えたときだけ、D39)、リスト通り +10、不要買いなし +5、予算超過 -20、不要買い 1 件ごとに -15。何も買っていない買い物はポイントなし (D28)。

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

### `POST /receipts/scan` (レシートの AI 判定、REQ-012)

`multipart/form-data` で送ります。`image` は JPEG / PNG / WebP で 5MB まで (frontend は送る前に長い辺 2000px の JPEG に縮めます)。`listId` は**今日 (JST) 終えた自分の買い物**の id です。

```bash
curl -H 'Authorization: Bearer test-u1' -F image=@receipt.jpg -F listId=<リストの id> http://localhost:3000/receipts/scan
```

```json
{
  "items": [
    { "name": "にんじん", "price": 98, "category": "food" },
    { "name": "ポテトチップス", "price": 128, "category": "snack" }
  ],
  "total": 800,
  "snackCount": 1,
  "snackTotal": 128,
  "snackRatio": 0.16,
  "verdict": "few_snack",
  "comment": "お菓子はちょっとだけ。じょうずに買えたね",
  "bonus": { "label": "レシート: お菓子ひかえめ", "points": 3 },
  "alreadyRewarded": false,
  "remaining": 4
}
```

- `category`: `food` (食材) / `daily` (日用品) / `drink` (飲み物) / `snack` (お菓子・嗜好品)。値引きの行は `price` がマイナス。
- `verdict` とボーナス (配点は仮。`backend/src/modules/receipts/domain/judge.ts`): お菓子・嗜好品なし `no_snack` +5 / 金額の 20% 以下 `few_snack` +3 / それより多い `some_snack`・50% 以上 `many_snack` はコメントだけ (マイナスなし)。
- ボーナスは **1 日 1 回** (JST)。2 回目以降は `bonus: null`、`alreadyRewarded: true`。1 件も買っていない買い物には付きません。
- 読めるのは **1 人 1 日 5 回**まで、**全ユーザーの合計で 1 日 200 回**まで (Claude API のコスト対策。合計の上限は環境変数 `RECEIPT_DAILY_GLOBAL_LIMIT` で変えられます)。`GET /receipts/status` は `{ "enabled": true, "limit": 5, "remaining": 4 }`。
- 失敗: `400` 画像でない / `404` 機能が無効・他人のリスト / `409` 買い物が終わっていない・今日の買い物でない / `413` 5MB 超 / `422` レシートが読めない / `429` 自分の今日の上限、または全体の上限 (「今日は混み合っています」) / `503` AI が混雑・停止・応答なし。
- 回数に数えない失敗は、**AI 側の都合 (429 と 5xx) だけ**です。AI が画像を受け付けなかった (400 系)、タイムアウト・接続エラー、読めなかった場合は数えます (壊れた画像を送り続けて API を呼び続けられないように)。
- Claude API を呼ばず固定の読み取り結果を返すのは、DB なし (メモリ実装) のときと、`RECEIPT_READER=memory` **かつ `NODE_ENV=development`** を明示したとき (DB ありのローカル確認用) だけです。`NODE_ENV` が未設定・`production` なら `RECEIPT_READER` は無視します。

### `/pantry` (家の在庫、REQ-013)

数量は持たず、品目名と「ある (`have`) / 少ない (`low`)」だけです。書き込みは API だけが行います。

```bash
curl -X POST -H 'Authorization: Bearer test-u1' -H 'Content-Type: application/json' \
  -d '{"names":["牛乳","トマト"]}' http://localhost:3000/pantry/items
curl -X POST -H 'Authorization: Bearer test-u1' -H 'Content-Type: application/json' \
  -d '{"names":[" 牛乳","とまと","卵"]}' http://localhost:3000/pantry/matches
```

```json
{
  "matches": [
    { "name": " 牛乳", "item": { "id": "…", "name": "牛乳", "status": "have", "stockedAt": "2026-11-17T00:30:00.000Z" } },
    { "name": "とまと", "item": { "id": "…", "name": "トマト", "status": "have", "stockedAt": "2026-11-17T00:30:00.000Z" } }
  ]
}
```

- `GET /pantry` と `POST /pantry/items` は `{ "items": [{ id, name, status, stockedAt }] }` を返します。
- 名前の比較は API が行います (`backend/src/modules/pantry/domain/name.ts`)。全角半角、空白、カタカナ / ひらがな、大文字小文字の違いは同じ品目として扱います。漢字とかな (卵 / たまご) は別の品目です。
- 在庫は 1 人 200 個までです (超えると `400`)。
- 画面: 買い物の結果画面の「買ったものを家の在庫に入れる」(購入済みの品目をまとめて `POST /pantry/items`)、リスト画面の「家にあるもの」(折りたたみ)。リストの品目が家にあると、品目の下に「家に◯◯があるよ (2 日前に入れた)」と出ます (足すのは止めません)。

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
