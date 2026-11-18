> 最新は [docs/guide/api.md](../guide/api.md)。

# 通貨・報酬・ショップ・ポイント履歴 API (Issue #33)

すべて `Authorization: Bearer <Supabase JWT>` が必要。エラーは `{ "error": "..." }`。
スーパー登録 (stores) は別担当のため、ここには含めない。

| メソッド / パス | 内容 | 応答 |
|---|---|---|
| `GET /me` | ペットと残高 | `{ petName, coins, score, level, exp, equippedItems: string[] }` |
| `POST /rewards/login` | ログイン報酬。**1 日 1 回 (JST)、冪等**。ログイン +20、今日の買い物判定がなければ +30 | `{ granted, rewards: [{reason, delta}], total, coins, score }` (付与済みなら `granted: false`、`rewards: []`) |
| `GET /shop/items` | マスタ + 所持 + 着用 | `[{ key, name, price, owned, equipped }]` |
| `POST /shop/items/:key/buy` | 購入 (コイン減算 + 所持追加は 1 トランザクション `buy_item` rpc) | `{ coins }`。コイン不足・所持済みは 400、未知の key は 404 |
| `PATCH /shop/items/:key/equip` | 着用 / 外す。body `{ "equipped": boolean }` | `{ key, equipped }`。未所持は 400、未知の key は 404 |
| `GET /history/points` | `point_logs` とショップでの購入 (`user_items`、おみやげは除く) を新しい順に最大 50 | `[{ id, kind: 'point' \| 'coin', delta, reason, createdAt }]` |

## 内部 (別 Issue から呼ぶ)
- `WalletRepo.addPoints(userId, delta, reason)`: `profiles.coins` / `score` を delta だけ増減 (coins は 0 未満にしない) し、`point_logs` に 1 行追加する (`add_points` rpc、1 トランザクション)。
- rpc (`buy_item`, `add_points`) は secret キー (service_role) だけが実行できる。`supabase/migrations/20261117000000_buy_item.sql`。
