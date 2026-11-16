# アーキテクチャ (React + Hono)

AI と人が迷わず同じ場所にコードを置けるよう、よく使われる構成に揃える。実装前に読む。
関連: 要件 [specs](./specs/2026-11-15-okaimonojyouzu/index.md)、DB [schema.html](./db/schema.html)、スキル `.claude/skills/hono/` `supabase/` `workers-best-practices/`

> **この構成は目安。** 必ずしもこの通りでなくてよい。新しい概念や要件が出て合わないときは、適宜変更してよい。
> 変更したら、このファイルも同じ PR で更新し、理由を末尾の「変更履歴」に 1 行書く。
> ただし、責務の分離とテストしやすさ (層の依存の向きを守ること) は崩さない。
> ライブラリは意欲的に検討するが、導入自体を目的にしない (何の問題を解くかを確認し、理由を Issue / PR に残す)。入れたことで構成が変わるなら、このファイルも更新する。

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

## 設計方針 (責務の分離とテスト容易性)

- **テストは、コアなドメイン (`backend/src/domain/`) にだけ最低限を書く** (下の「テスト方針」)。そのため「ロジックは純粋関数」「外部 (DB・時刻・乱数) は引数で渡す」を守る。
- 判断基準は 1 つ: **ビジネスロジックを Hono・Supabase・React なしで呼べるか。**

## フロントエンド (`frontend/`)

feature ごとにまとめる。ルートは薄く、ロジックは feature に置く。

```
frontend/app/
├─ root.tsx
├─ routes.ts              # ルート定義 (画面 ↔ ファイル)
├─ routes/                # ルートモジュール = 画面。clientLoader / clientAction / 組み立てだけ
├─ features/              # 機能ごと (auth, list, shopping, pet, history, store)
│   └─ list/
│       ├─ index.ts       # 公開 API。外から import してよいのはここだけ
│       ├─ components/    # 見た目だけ (props を受けて描画)
│       ├─ hooks/         # 状態・副作用 (useXxx)
│       ├─ logic/         # 純粋関数 (合計金額、予算超過の判定など)。React 非依存
│       ├─ api.ts         # hc を呼ぶ薄い関数 (clientLoader / clientAction から使う)
│       └─ types.ts
├─ components/            # 機能に依存しない共通 UI
├─ lib/                   # api.ts (hc クライアント), supabase.ts (publishable キーのみ), utils.ts
├─ hooks/                 # 共通フック
└─ styles/
```

依存の向き: `routes → features/*/index.ts → (components / hooks / logic / api) → lib, components`

**禁止する import**
- feature は他の feature の内部を import しない。他 feature が必要なら相手の `index.ts` 経由だけ。循環させない。共有したいものは `components/` `lib/` へ上げる。
- `components/` `lib/` は `features/` `routes/` を import しない。
- feature は `routes/` を import しない。
- `logic/` は React・hc・supabase を import しない (純粋関数に保つ)。
- `components/` は fetch (`api.ts` / hc) を直接呼ばない。データは props で受ける。

ルール:
- スタイルは **Tailwind v4**。色・影・角丸は `styles/app.css` の `@theme` で定義済み (`bg-sun`、`border-ink`、`shadow-pop`、`rounded-card` など。縁取りは `border-3`)。グローバル CSS は `@theme` と `@layer base` だけにし、クラス名ベースの CSS は書かない。
- 共通部品 (`components/` の Button / Card / ProgressBar / BottomSheet / Toast / Coin / TabBar / Screen) は見た目を持つ。**機能の画面は共通部品を使い、レイアウト (余白・並び・幅) だけ Tailwind のユーティリティで書く。** 色や縁取りを画面側で直接書かない (足りなければ共通部品か `@theme` に足す)。
- 画面は `docs/mock/index.html` に合わせる。スマホ幅 390px、タップ領域 44px 以上 (`CLAUDE.md` 参照)。
- データ取得と更新は React Router の **clientLoader / clientAction** (frontend は SPA モード `ssr: false`。セッションがブラウザの supabase-js にあるため。仮決め。TanStack Query は入れない)。**clientLoader / clientAction は `features/*/api.ts` を呼んで返すだけ**にし、判定や整形は `logic/` に置く。
- 型は `any` を使わない。API の型は backend の `AppType` から得る (手で重複して書かない)。
- フォームの入力検証は zod (backend のスキーマを共有できるなら共有する)。
- secret / service_role キーは front に置かない。`VITE_` で始まる変数は公開される。
- コンポーネント: 1 ファイル 1 コンポーネント、PascalCase。フックは `useXxx`。

## バックエンド (`backend/`)

Hono の流儀に従い、**ルート定義にハンドラーをインラインで書く** (コントローラーに切り出さない。型推論が切れるため)。ただしインラインのハンドラーは「入力を取り出す → service を呼ぶ → 返す」だけにする。

```
backend/src/
├─ index.ts           # Node 起動 (ローカル)。deps を作って createApp に渡す
├─ worker.ts          # Workers の entry。`c.env` から deps を作る
├─ app.ts             # `createApp(deps)` と `export type AppType = ReturnType<typeof createApp>`
├─ deps.ts            # `Deps` 型 (services, clock, random ...) と本番用の組み立て (唯一の組み立て場所)
├─ routes/            # ルートごとに 1 ファイル。`(deps) => new Hono()...` のチェーン
├─ services/          # ユースケース (購入する、買い物を終える)。repository と domain を組み合わせる
├─ domain/            # 純粋関数 (スコア計算、報酬の判定、日次判定、レベル)。I/O なし
├─ repositories/      # DB アクセスはここだけ
│   ├─ types.ts       # interface (ListRepo, WalletRepo ...)
│   ├─ supabase/      # 本番実装 (supabase-js)
│   └─ memory/        # インメモリ実装 (DB なしのローカル確認に使う)
├─ schemas/           # zod スキーマ (リクエスト検証)
├─ middleware/        # auth (JWT 検証)、error、cors
└─ lib/               # env.ts (`Bindings` の型)、supabase.ts (クライアント生成。deps.ts からだけ使う)
```

### 層と依存の向き

```
route ──▶ service ──▶ repository (interface)
  │          │              ▲
  │          └──▶ domain    └── supabase 実装 / memory 実装 ──▶ Supabase
  └──▶ schemas
```

| 層 | 責務 | 持ってはいけないもの |
|---|---|---|
| route | 入力検証、service 呼び出し、応答 | 計算、DB 呼び出し |
| service | 手順の組み立て (取得 → domain で判定 → 保存) | Hono の型 (`Context`)、supabase-js |
| domain | 純粋な規則と計算 | I/O、`Date.now()`、`Math.random()`、他層の import |
| repository | DB の読み書きと行 ↔ 型の変換 | ビジネス判定 (報酬を出すか等) |

**禁止する import**
- route は repository / supabase-js を import しない (service 経由)。
- service は `hono` と `@supabase/supabase-js` を import しない。repository は `repositories/types.ts` の interface に依存する。
- domain は何も import しない (型と他の domain だけ)。
- repository は service / route を import しない。
- `lib/supabase.ts` は `deps.ts` と `repositories/supabase/` 以外から import しない。
- service 同士の呼び合いは最小限にし、循環させない。共通処理は domain へ。

各層の例 (抜粋):

```ts
// domain/reward.ts  純粋関数。時刻は引数で受ける
export const isNewDay = (lastJstDate: string | null, now: Date) =>
  lastJstDate !== toJstDate(now)

// repositories/types.ts  service が依存するのはこれだけ
export interface WalletRepo {
  get(userId: string): Promise<Wallet>
  save(userId: string, w: Wallet): Promise<void>
}

// services/rewards.ts  依存は引数で受ける
export const claimLoginReward = (d: { wallet: WalletRepo; clock: () => Date }) =>
  async (userId: string) => { /* 取得 → isNewDay → 付与 → save */ }

// routes/rewards.ts  薄いインラインハンドラー
export const rewards = (d: Deps) =>
  new Hono<Env>().post('/rewards/login', async (c) =>
    c.json(await d.services.claimLoginReward(c.var.user.id)))

// app.ts
export const createApp = (d: Deps) => new Hono<Env>().route('/', rewards(d)).route('/', lists(d))
```

ルール:
- 入力は `@hono/zod-validator` で検証する。エラーは `HTTPException` で返す (service は独自のエラー型を投げ、middleware で変換してよい)。
- Cloudflare の変数は `c.env` から取り、`Bindings` に型を付ける。Node 専用 API は使わない。`Deps` は `worker.ts` / `index.ts` で作り、`createApp` に渡す。
- 認証は middleware で Supabase の JWT を検証し、`c.var.user` に入れる。
- 通貨・スコアなど RLS で拒否している列は、**repository の supabase 実装が** secret キーのクライアントで更新する。**secret キーは API の中だけ**。
- 複数テーブルの更新 (購入で通貨を減らし所持品を増やす等) は Postgres 関数 (`rpc`) にして 1 回の呼び出しにする。supabase-js にトランザクションはない。呼び出しは repository 内に閉じる。
- 確認は `npx -y @hono/cli request backend/src/app.ts -P /lists` のように行う (API のテストコードは書かない)。

## テスト方針

**最低限だけ書く。** 速度を優先し、壊れると困るところだけを守る。

- **書く**: `backend/src/domain/` の純粋関数 (スコア計算、報酬判定、JST の日付)。Vitest で、テストは対象の隣に `*.test.ts` として置く。実行は `pnpm --filter backend test`。
- **量**: 正常系と、ビジネス上大事な境界 (予算ちょうど、日付の境界) を、1 関数あたり数ケースまで。
- **書かない**: 画面のテスト、DB や API の網羅的なテスト、重箱の隅を突くテスト。これらは、画面または API (`@hono/cli request`、memory 実装) で正常系を確認する。
- **いつ**: `domain/` の関数を足した、または変えた PR に、テストも入れる。あとからまとめて書かない。

テストしやすさを保つために守ること:

1. **ロジックの置き場所**: スコア計算・報酬判定・購入可否・日次判定は backend の `domain/` (純粋関数)。frontend の判定・整形は `features/*/logic/`。
2. **時刻と乱数は注入する**: `Date.now()` `new Date()` `Math.random()` を domain / service で直接呼ばない。`Deps` の `clock: () => Date` `random: () => number` を使う。JST の日付境界は `toJstDate(date)` に 1 か所で集める。
3. **`createApp(deps)`**: `app` をモジュールのトップレベルで作らない。in-memory の deps (`createMemoryDeps`) を渡せば、DB なしで `app.request('/lists', { headers })` を呼べる。
4. **モックではなくインメモリ実装**: `repositories/memory/` に interface を満たす `Map` ベースの実装を置く (必要になった repository から作る)。モックライブラリで呼び出しを検証するより、結果の状態を検証する。
5. **frontend**: コンポーネントは props を描画するだけ、データ取得は clientLoader / `api.ts`、判定は `logic/`。frontend のテストは書かない (大事な判定は backend の `domain/` に置く)。

## 依存の向きを機械で守る (任意・今は導入しない)

- **ESLint `no-restricted-imports`** (または `eslint-plugin-boundaries`): `services/**` から `hono` `@supabase/supabase-js` を、`domain/**` から全部を禁止、など上の禁止表をそのまま設定にできる。最小でまずこれ。
- **dependency-cruiser**: 層・feature の依存ルールと循環の検出を CI で行う。規模が大きくなったら。
- どちらも入れない間は、親エージェントがマージ前に上の「禁止する import」を確認する (`autopilot` skill の「5. PR と自動マージ」に grep がある)。

## ブランチとデプロイ

```
feat/* ─PR→ dev ─PR→ staging ─PR→ main
 (開発)   (統合)    (検証用)     (本番)
  デプロイなし  デプロイなし   デプロイ     デプロイ
```

- **`staging` と `main` だけ自動でデプロイする。** `dev` と feature ブランチは、デプロイしない (Vercel Hobby の回数制限と、検証以外でのデプロイを避けるため)。
- `frontend/vercel.json` の `git.deploymentEnabled` で、`dev` `feat/*` `fix/*` `chore/*` `docs/*` を false にしている。それ以外 (`staging` `main`) は既定の true。
- 動作を確認したいとき (目安はフェーズの完了時) だけ、`dev` から `staging` へ PR を出す。`dev` へのマージは親エージェントが自動で行うが、`staging` と `main` へのマージは自動にしない (デプロイを伴うため)。
- 既定ブランチは `main`。そのため、`dev` 向けの PR の `Closes #N` では Issue が閉じない (マージ後に手で閉じる)。
- 既存の README やワークフローには、`dev` を明示的にデプロイする記述はなかった (2026-11-16 確認)。`dev` のデプロイが必要になったら、このファイルと `vercel.json` を直す。
- API (Workers) も同じ方針。`staging` と `main` を別の Worker / 環境として `wrangler.jsonc` で分ける。

## 環境変数
- `backend/.env`、`frontend/.env` に置く。ひな形は `*.env.example`。**`.env` はコミットしない。**
- 共有してよい: URL、publishable キー。共有しない: secret / service_role キー、DB パスワード、`ANTHROPIC_API_KEY`。

## 変更履歴
- 2026-11-16: レビューで repository 層・domain 層・`createApp(deps)`・禁止 import・テスト容易性ルールを追加 (責務の分離と後からのテスト追加のため)。
- 2026-11-16: ライブラリの選定方針を追記 (意欲的に検討するが、導入を目的にしない。構成の変更も可)。
- 2026-11-16: テスト方針を「書かない」から「`domain/` の純粋関数にだけ最低限を書く (Vitest)」に変更 (スコアや日付の境界は、画面の確認では壊れても気づきにくいため)。
- 2026-11-16: フロントのスタイル規則を追加。デザイン変数を Tailwind の `@theme` に移し、共通コンポーネントを Tailwind ユーティリティで書き直した (グローバル CSS の重複を無くし、画面はレイアウトだけを書くため)。
- 2026-11-16: frontend を SPA モード (`ssr: false`) にし、loader / action を clientLoader / clientAction に統一した (セッションがブラウザにあり、SSR 用の目印 cookie が不要になるため)。
