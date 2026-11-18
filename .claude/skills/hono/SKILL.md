---
name: hono
description: Hono (バックエンド API) を実装・変更するときに使う。実装前に公式ドキュメントを引き、実装後に API の正常系をサーバーなしで確認する。
---

# hono

バックエンドは Hono (Cloudflare Workers)。学習データが古いと API を誤るので、**推測で書かず公式ドキュメントを引く**。

## コマンド (インストール不要、`npx` で実行)

| 用途 | コマンド |
| --- | --- |
| ドキュメント検索 (JSON) | `npx -y @hono/cli search "<キーワード>"` |
| ドキュメント本文 | `npx -y @hono/cli docs <path>` (`search` の `path` を渡す) |
| API の動作確認 | `npx -y @hono/cli request <app.ts> -P /path -X POST -d '{...}' -H 'Content-Type: application/json' -i` |

`request` はサーバーを立てずに `app.request()` で叩く。**API のテストコードは書かない方針なので、これを正常系の確認に使う** (テストを書くのは `domain/` の純粋関数だけ)。

## 実装ルール

- 実装前に `search` で該当 API を確認する。中身が曖昧なら `docs` で本文を読む。
- ハンドラーはルート定義にインラインで書く。Express 風にコントローラーへ切り出さない (型推論が切れる)。
- 入力検証は `@hono/zod-validator` を使う。
- Cloudflare の環境変数・バインディングは `c.env` から取り、`Bindings` の型を付ける。Node.js 専用 API は使わない。
- ルートはチェーンで書き、`export type AppType = typeof app` を公開する。front は `hc<AppType>` で型付きに呼ぶ。API 契約の食い違いを防ぐため。
- エラーは `HTTPException` で返す。
- front と back をつなぐ API (パス・リクエスト・レスポンス) は、並列開発の第 1 波で決めて固定する。

## 手順

1. (親エージェントのみ) `.claude/todo/progress.md` を読み、同じタスクが作業中でないか確認する。
2. 実装する API を `search` で確認する。
3. 実装する。
4. `request` で正常系を確認し、結果を PR の「動作確認」に 1 行で書く。
