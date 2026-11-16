# アーキテクチャ (React + Hono)

AI と人が迷わず同じ場所にコードを置けるよう、よく使われる構成に揃える。実装前に読む。
関連: 要件 [specs](./specs/2026-11-15-okaimonojyouzu/index.md)、DB [schema.html](./db/schema.html)、スキル `.claude/skills/hono/` `supabase/` `workers-best-practices/`

## 全体像

```
[スマホブラウザ]
   │  React (React Router v7)  ── Vercel
   │      ├─ Supabase Auth (ログイン、publishable キー)
   │      └─ Hono API を hc (型付き RPC) で呼ぶ
   ▼
[Hono API]  ── Cloudflare Workers (Free)
   │      ├─ 認証の検証 (Supabase の JWT)
   │      ├─ 報酬・ポイント・購入など、サーバーだけが行う更新
   │      └─ supabase-js (secret キー) で DB を操作
   ▼
[Supabase]  Postgres + Auth + RLS
```

- **クライアントが直接書いてよいもの**: リスト、品目、スーパー登録、ペット名、着用中 (RLS で本人の行だけ)。
- **API だけが書くもの**: コイン、スコア、レベル、経験値、日次の報酬、リストの状態と支出額、アイテム購入 (RLS で拒否してある)。

## フロントエンド (`frontend/`)

feature ごとにまとめる (機能単位のディレクトリ構成)。ルートは薄く、ロジックは feature に置く。

```
frontend/app/
├─ root.tsx
├─ routes.ts              # ルート定義 (画面 ↔ ファイル)
├─ routes/                # ルートモジュール = 画面。薄く保つ (loader / action / 画面の組み立てだけ)
│   ├─ _auth.login.tsx
│   ├─ home.tsx           # ホーム (ペット)
│   ├─ lists.tsx          # 買い物リスト
│   ├─ shopping.tsx       # 買い物中
│   ├─ history.tsx        # 履歴
│   └─ stores.tsx         # スーパー登録
├─ features/              # 機能ごと。他の feature の中身は直接 import しない
│   ├─ auth/        { components/, hooks/, api.ts, types.ts }
│   ├─ list/        # 買い物リスト、品目、予算
│   ├─ shopping/    # 買い物中、リスト外の確認、結果判定
│   ├─ pet/         # ペット、報酬の演出、ショップ・着せ替えのポップアップ
│   ├─ history/     # ポイント・購入履歴
│   └─ store/       # スーパー登録、位置情報
├─ components/        # 機能に依存しない共通 UI (Button, Sheet, ProgressBar ...)
├─ lib/
│   ├─ api.ts         # Hono の hc クライアント (AppType を import)
│   ├─ supabase.ts    # Supabase クライアント (publishable キーのみ)
│   └─ utils.ts
├─ hooks/             # 共通フック
└─ styles/            # グローバル CSS、デザイン変数 (docs/mock/index.html の配色)
```

ルール:
- 画面は `docs/mock/index.html` に合わせる。スマホ幅 390px、タップ領域 44px 以上 (`CLAUDE.md` 参照)。
- データ取得と更新は、React Router の **loader / action** に統一する (仮決め。TanStack Query は入れない)。
- 型は `any` を使わない。API の型は backend の `AppType` から得る (手で重複して書かない)。
- フォームの入力検証は zod (backend と同じスキーマを使えるなら共有する)。
- secret / service_role キーは front に置かない。`VITE_` で始まる変数は公開される。
- コンポーネント: 1 ファイル 1 コンポーネント、名前は PascalCase。フックは `useXxx`。

## バックエンド (`backend/`)

Hono の流儀に従い、**ルート定義にハンドラーをインラインで書く** (コントローラーに切り出さない。型推論が切れるため)。ビジネスロジックは service に置く。

```
backend/src/
├─ index.ts           # ローカル起動 (@hono/node-server) と Workers 用の export
├─ app.ts             # アプリの組み立て。`export type AppType = typeof app`
├─ routes/            # ルートごとに 1 ファイル。チェーンで書く
│   ├─ lists.ts       # /lists, /lists/:id, /lists/:id/items ...
│   ├─ shopping.ts    # 開始、リスト外の追加、終了と判定
│   ├─ rewards.ts     # ログイン報酬、買い物に行かなかった報酬
│   ├─ shop.ts        # アイテム購入、着用
│   ├─ stores.ts      # スーパー登録
│   └─ history.ts     # 履歴
├─ services/          # ビジネスロジック (スコア計算、報酬、購入)。Hono に依存しない
├─ schemas/           # zod スキーマ (リクエスト検証)
├─ middleware/        # auth (JWT 検証)、error、cors
└─ lib/
    ├─ supabase.ts    # ユーザー JWT 付きクライアント / secret クライアントの生成
    └─ env.ts         # `Bindings` の型
```

ルール:
- **層**: route (入力検証と応答) → service (ロジック) → supabase-js (DB)。route に計算を書かない。
- 入力は `@hono/zod-validator` で検証する。エラーは `HTTPException` で返す。
- Cloudflare の変数は `c.env` から取り、`Bindings` に型を付ける。Node 専用 API は使わない。
- 認証は middleware で Supabase の JWT を検証し、`c.var.user` に入れる。
- 通貨・スコアなど RLS で拒否している列は、service が secret キーのクライアントで更新する。**secret キーは API の中だけ**。
- 確認は `npx -y @hono/cli request backend/src/app.ts -P /lists` のように行う (テストコードは書かない)。

## ブランチとデプロイ

```
feat/* ─PR→ dev ─PR→ staging ─PR→ main
 (開発)   (統合)    (検証用)     (本番)
  デプロイなし  デプロイなし   デプロイ     デプロイ
```

- **`staging` と `main` だけ自動でデプロイする。** `dev` と feature ブランチは、デプロイしない (Vercel Hobby の回数制限と、検証以外でのデプロイを避けるため)。
- `frontend/vercel.json` の `git.deploymentEnabled` で、`dev` `feat/*` `fix/*` `chore/*` `docs/*` を false にしている。それ以外 (`staging` `main`) は既定の true。
- 動作を確認したいときだけ、`dev` から `staging` へ PR を出してマージする。
- 既存の README やワークフローには、`dev` を明示的にデプロイする記述はなかった (2026-11-16 確認)。`dev` のデプロイが必要になったら、このファイルと `vercel.json` を直す。
- API (Workers) も同じ方針。`staging` と `main` を別の Worker / 環境として `wrangler.jsonc` で分ける。

## 環境変数
- `backend/.env`、`frontend/.env` に置く。ひな形は `*.env.example`。**`.env` はコミットしない。**
- 共有してよい: URL、publishable キー。共有しない: secret / service_role キー、DB パスワード、`ANTHROPIC_API_KEY`。
