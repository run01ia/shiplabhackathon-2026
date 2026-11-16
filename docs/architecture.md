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

- **テストは、コアなドメイン (`modules/<機能>/domain/` と `shared/domain/`) にだけ最低限を書く** (下の「テスト方針」)。そのため「ロジックは純粋関数」「外部 (DB・時刻・乱数) は引数で渡す」を守る。
- 判断基準は 1 つ: **ビジネスロジックを Hono・Supabase・React なしで呼べるか。**

## フロントエンド (`frontend/`)

feature ごとにまとめる。ルートは薄く、ロジックは feature に置く。

```
frontend/app/
├─ root.tsx
├─ routes.ts              # ルート定義 (画面 ↔ ファイル)
├─ routes/                # ルートモジュール = 画面。clientLoader / clientAction / 組み立てだけ
├─ features/              # 機能ごと (auth, list, shopping, pet, history。stores は #6 で追加予定)
│   └─ list/
│       ├─ index.ts       # 公開 API。外から import してよいのはここだけ
│       ├─ components/    # 見た目だけ (props を受けて描画)
│       ├─ hooks/         # 状態・副作用 (useXxx)
│       ├─ logic/         # 純粋関数 (合計金額、予算超過の判定など)。React 非依存
│       ├─ api.ts         # hc を呼ぶ薄い関数 (clientLoader / clientAction から使う)
│       └─ types.ts
├─ components/            # 機能に依存しない共通 UI
├─ lib/                   # api.ts (hc クライアント), supabase.ts (publishable キーのみ), utils.ts
├─ hooks/                 # 共通フック (必要になったら作る。今はない)
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

**feature モジュール + use-case 層。** 機能ごとにフォルダを切り (`modules/<名前>/`)、その中を層で分ける。5 行で言うと:

1. **routes (= controller)**: HTTP のアダプター。入力を検証し、use-case を呼び、結果を返すだけ。
2. **use-case**: 1 操作 = 1 ファイルの関数。手順 (取得 → domain で判定 → 保存) を組み立てる。
3. **repository (interface)**: use-case が DB に頼むことの一覧 (port)。**infra** がその実装 (supabase / memory)。
4. **domain**: 純粋関数。業務の規則はその機能の `modules/<機能>/domain/` (スコア = lists、報酬 = profile)、機能をまたぐもの (JST の日付) は `shared/domain/`。同じ domain と `shared/domain/` 以外を import しない。
5. 依存は `routes → use-case → repository (interface) ← infra` の一方向。実装を選ぶのは `deps.ts` だけ。

```
backend/src/
├─ index.ts              # Node 起動 (ローカル)。deps を作って createApp に渡す
├─ worker.ts             # Workers の entry。`c.env` から deps を作る (未作成)
├─ app.ts                # `createApp(deps)` と `AppType`。モジュールの routes を束ねるだけ
├─ deps.ts               # `Deps` 型と組み立て (createDeps / createMemoryDeps)。infra を import してよい唯一の場所
├─ modules/              # 機能ごと: lists / wallet / shop / profile
│   └─ lists/
│       ├─ routes.ts     # controller を兼ねる。`(deps) => new Hono()...` のチェーン
│       ├─ controller.ts # (必要なときだけ) `factory.createHandlers(...)` で書いたハンドラー
│       ├─ schemas.ts    # zod スキーマ (リクエスト検証)
│       ├─ repository.ts # interface (ListRepo) と型 (List, ListItem)。他モジュールに見せてよいのはここだけ
│       ├─ usecases/     # 1 操作 = 1 ファイル (create-list.ts, finish-shopping.ts ...)
│       │   ├─ index.ts  # `createListUsecases(deps)`: 依存を渡して束ねる
│       │   └─ guards.ts # 複数の use-case が使う取得・状態確認 (use-case 同士は呼び合わない)
│       ├─ domain/       # この機能の業務の規則 (純粋関数 + *.test.ts)。例: lists/domain/score.ts、profile/domain/reward.ts
│       └─ infra/        # supabase.ts (本番) と memory.ts (DB なしの確認用)
└─ shared/               # errors.ts (AppError)、env.ts (`Bindings`)、supabase.ts (クライアント生成)、middleware/ (auth、error)
    └─ domain/           # 機能をまたぐ純粋関数 (date.ts: JST の日付)
```

モジュールと担当: `lists` (リスト・品目・買い物・履歴)、`wallet` (コイン・スコア・ポイント履歴)、`shop` (着せ替えの購入・着用)、`profile` (`/me`、ログイン報酬)。

モジュールを足すとき: `modules/<名前>/` を作る → `deps.ts` の `Repositories` に repository を足す → `app.ts` に `.route('/', xxx(d))` を 1 行足す → `biome.json` の「他モジュール」の group (`**/<名前>/**`) に名前を足す。

### 層と依存の向き

```
routes (controller) ──▶ use-case ──▶ repository (interface) ◀── infra (supabase / memory) ──▶ Supabase
        │                  │                                        ▲
        └──▶ schemas       └──▶ domain (純粋関数)                    └── deps.ts が実装を選んで渡す
```

| 層 | 責務 | 持ってはいけないもの |
|---|---|---|
| routes (controller) | 入力検証 (`zValidator`)、use-case 呼び出し、結果とエラーの HTTP への変換 | 業務ロジック (計算、判定)、DB 呼び出し |
| use-case | 手順の組み立て (取得 → domain で判定 → 保存)。エラーは `AppError` を投げる | Hono の型 (`Context`)、zod、supabase-js |
| domain | 純粋な規則と計算 | I/O、`Date.now()`、`Math.random()`、他層の import |
| repository (interface) | use-case が DB に頼むことの一覧と、その型 | 実装、上位の層 |
| infra | DB の読み書きと行 ↔ 型の変換 | ビジネス判定 (報酬を出すか等) |

### controller の書き方 (Hono の流儀)

controller は「HTTP のアダプター層」で、**各モジュールの `routes.ts` が兼ねる**。ハンドラーはパス定義の直後にインラインで書く (パスの param と `AppType` / `hc` の型推論を保つため)。

- ハンドラーが長い、または使い回したいときだけ、`modules/<名前>/controller.ts` に **`createFactory<Env>().createHandlers(zValidator(...), handler)`** (`hono/factory`) で書き、`routes.ts` で `.post('/x', ...handlers)` と繋ぐ。
- **`(c: Context) => ...` の関数を切り出すことは禁止** (Rails 風の controller。param の型が推論できず、`hc` の型共有も壊れる。[Hono の Best Practices](https://hono.dev/docs/guides/best-practices))。
- ハンドラーが長くなる原因が業務ロジックなら、controller ではなく use-case に移す。

### use-case の書き方

**`(依存) => (入力) => 結果` の関数。1 操作 = 1 ファイル。** 依存は、その use-case が使う分だけを型に書く (何に触るかが、ファイルの先頭で分かる)。

```ts
// modules/lists/usecases/start-shopping.ts
export const startShopping = (d: { lists: ListRepo }) => async (userId: string, listId: string) => {
  const list = await getOwnedList(d.lists, userId, listId) // guards.ts。なければ AppError('not_found')
  if (list.status !== 'planning') throw new AppError('conflict', 'list already started')
  return toDetail(d.lists, await d.lists.update(listId, { status: 'shopping' }))
}

// modules/lists/usecases/index.ts  依存を 1 回渡して束ねる
export const createListUsecases = (d: ListUsecaseDeps) => ({ startShopping: startShopping(d) /* ... */ })

// modules/lists/routes.ts  controller。入力を取り出す → use-case → 返す
export const lists = (d: Deps) => {
  const u = createListUsecases({ ...d.repos, clock: d.clock })
  return new Hono<Env>()
    .use('/lists/*', auth(d))
    .post('/lists/:id/start', async (c) => c.json(await u.startShopping(c.var.user.id, c.req.param('id'))))
}
```

### モジュールをまたぐ依存

- 他モジュールから import してよいのは、**相手の `repository.ts` (interface と型) だけ**。相手の use-case / infra / routes は import しない。
- use-case は、相手の interface の**必要なメソッドだけ**を依存として受け取る。実装は `deps.ts` が渡す。

```ts
// modules/lists/usecases/finish-shopping.ts  買い物の終了は、wallet と profile にも書く
type Deps = {
  lists: ListRepo
  profiles: Pick<ProfileRepo, 'markShoppingJudged'> // ../../profile/repository
  wallets: Pick<WalletRepo, 'addPoints'>            // ../../wallet/repository
  clock: () => Date
}
```

- モジュールの向きは `lists → profile → shop → wallet` (右が下位)。**逆向きの import を足さない** (循環を作らない)。逆向きに必要になったら、共通の規則は `shared/domain/` へ、手順は呼ぶ側のモジュールの use-case へ置く。
- infra も同じ。memory の shop は、コインを wallet の interface (`get` / `save`) 経由で読み書きする。他モジュールの infra は import しない。

### 禁止する import (Biome が検査する)

`biome.json` の `overrides` + `noRestrictedImports` で検査する。`pnpm exec biome check backend` でエラーになる (`import type` も対象)。

| 対象 | import してはいけないもの |
|---|---|
| `**/domain/**` (テストを除く) | 同じ `domain/` と `shared/domain/` 以外のすべて |
| `modules/*/usecases/**` | `hono`、`@hono/*`、`zod`、`@supabase/*`、`infra/`、`routes`、`controller`、`schemas`、`deps`、`app`、`shared/supabase`、`shared/middleware/`、他モジュール (`repository` を除く) |
| `modules/*/routes.ts`、`controller.ts` | `@supabase/*`、`infra/`、`repository`、`domain`、`shared/supabase`、他モジュールのすべて (use-case と schemas だけを呼ぶ) |
| `modules/*/repository.ts`、`schemas.ts` | `hono`、`@hono/*`、`@supabase/*`、`infra/`、`usecases`、`routes`、`controller`、`deps`、`app`、他モジュール (`repository` を除く) |
| `modules/*/infra/**` | `hono`、`@hono/*`、`zod`、`usecases`、`routes`、`controller`、`schemas`、`domain`、`deps`、`app`、他モジュール (`repository` を除く) |
| `shared/**` | `modules/`、`deps`、`app`。`@supabase/*` は `shared/supabase.ts` だけ |
| `app.ts` | `@supabase/*`、`infra/`、`shared/supabase` |

- `deps.ts` と `index.ts` (組み立て) には制限がない。infra を import するのはここだけ。
- routes は `Deps` の**型**を `deps.ts` から import する (`import type`)。値は import しない。
- use-case 同士は呼び合わない。共通の手順は同じモジュールの `usecases/guards.ts`、規則は同じモジュールの `domain/` に置く。

### ファイルの大きさ

**1 ファイル 約 120 行まで。** 超えたら、次の順で分ける。

- `routes.ts`: 関連するパスごとに `routes/<名前>.ts` に分け、`routes.ts` で `.route('/', ...)` と束ねる。
- use-case: 1 操作 = 1 ファイルなので増えない。1 つが長いなら、判定を同じモジュールの `domain/` の純粋関数に出す。
- `repository.ts`: interface を対象ごと (例: `ListRepo` と `ListItemRepo`) に分ける。
- `infra/supabase.ts`: 対象のテーブルごとに分け、スプレッドで合わせる (例: `supabase.ts` + `supabase-items.ts` + 行の変換 `supabase-rows.ts`)。
- モジュール自体が大きい (use-case が 15 個を超える) なら、モジュールを分ける。

ルール:
- 入力は `@hono/zod-validator` で検証する。エラーは `HTTPException` で返す (use-case は `shared/errors.ts` の `AppError` を投げ、`shared/middleware/error.ts` が HTTP に変換する)。
- Cloudflare の変数は `c.env` から取り、`Bindings` に型を付ける。Node 専用 API は使わない。`Deps` は `worker.ts` / `index.ts` で作り、`createApp` に渡す。
- 認証は middleware で Supabase の JWT を検証し、`c.var.user` に入れる。
- 通貨・スコアなど RLS で拒否している列は、**infra の supabase 実装が** secret キーのクライアントで更新する。**secret キーは API の中だけ**。
- 複数テーブルの更新 (購入で通貨を減らし所持品を増やす等) は Postgres 関数 (`rpc`) にして 1 回の呼び出しにする。supabase-js にトランザクションはない。呼び出しは infra 内に閉じる。
- 確認は `npx -y @hono/cli request backend/src/app.ts -P /lists` のように行う (API のテストコードは書かない)。

## テスト方針

**最低限だけ書く。** 速度を優先し、壊れると困るところだけを守る。

- **書く**: `modules/*/domain/` と `shared/domain/` の純粋関数 (スコア計算、報酬判定、JST の日付)。Vitest で、テストは対象の隣に `*.test.ts` として置く。実行は `pnpm --filter backend test`。
- **量**: 正常系と、ビジネス上大事な境界 (予算ちょうど、日付の境界) を、1 関数あたり数ケースまで。
- **書かない**: 画面のテスト、DB や API の網羅的なテスト、重箱の隅を突くテスト。これらは、画面または API (`@hono/cli request`、memory 実装) で正常系を確認する。
- **いつ**: `domain/` の関数を足した、または変えた PR に、テストも入れる。あとからまとめて書かない。

テストしやすさを保つために守ること:

1. **ロジックの置き場所**: スコア計算・報酬判定・購入可否・日次判定は backend の各モジュールの `domain/` (純粋関数)。frontend の判定・整形は `features/*/logic/`。
2. **時刻と乱数は注入する**: `Date.now()` `new Date()` `Math.random()` を domain / use-case で直接呼ばない。`Deps` の `clock: () => Date` `random: () => number` を使う。JST の日付境界は `toJstDate(date)` に 1 か所で集める。
3. **`createApp(deps)`**: `app` をモジュールのトップレベルで作らない。in-memory の deps (`createMemoryDeps`) を渡せば、DB なしで `app.request('/lists', { headers })` を呼べる。
4. **モックではなくインメモリ実装**: 各モジュールの `infra/memory.ts` に interface を満たす `Map` ベースの実装を置く (必要になった repository から作る)。モックライブラリで呼び出しを検証するより、結果の状態を検証する。
5. **frontend**: コンポーネントは props を描画するだけ、データ取得は clientLoader / `api.ts`、判定は `logic/`。frontend のテストは書かない (大事な判定は backend の `domain/` に置く)。

## 依存の向きを機械で守る

- **backend は Biome の `noRestrictedImports` で検査する** (`biome.json` の `overrides`。規則は上の「禁止する import (Biome が検査する)」)。`pnpm exec biome check backend` (または `pnpm check`) が通らない PR はマージしない。
- 規則は import の文字列 (相対パス) をパターンで見る。そのため、**フォルダ名 (`infra` `usecases` `routes` `repository` と、モジュール名) を規則どおりに保つ**。モジュールを足したら、`biome.json` の group にモジュール名を足す。
- 循環の検出はしていない (モジュールの向きは上の「モジュールをまたぐ依存」で決めている)。規模が大きくなったら **dependency-cruiser** を検討する。
- frontend の禁止 import は、まだ機械で検査していない (親エージェントがマージ前に確認する)。

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
- 2026-11-16: backend を「技術の種類のフォルダ (routes / services / repositories)」から「feature モジュール + use-case 層」に再構成 (#51)。1 ファイルに機能が同居して大きくなり (supabase 実装 290 行)、use-case という単位がなかったため。controller は routes.ts が兼ねる (Hono の型推論を保つ)。禁止 import は Biome で検査する。Issue の案 (lists / wallet / shop) に `profile` モジュールを足した (`/me` とログイン報酬を wallet に置くと、wallet ⇄ shop が循環するため)。
- 2026-11-16: `domain/` を機能ごとに分けた (スコア → `modules/lists/domain/`、報酬 → `modules/profile/domain/`、JST の日付 → `shared/domain/`)。業務の規則がその機能の中にあるほうが、どこを直せばよいか迷わないため。
