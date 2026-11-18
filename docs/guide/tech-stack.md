# 使っている技術

バージョンは `package.json` (ルート、`frontend/`、`backend/`) が正です。
選んだ理由の詳細は [../decisions.md](../decisions.md) の行番号 (D04 など) を見てください。

## 全体

| 名前 | 何に使うか | なぜ選んだか | ドキュメント |
|---|---|---|---|
| TypeScript | frontend と backend の両方の言語 | 型でミスを早く見つけられる。front と back で型を共有できる | https://www.typescriptlang.org/docs/ |
| pnpm (workspace) | パッケージ管理。`frontend` と `backend` を 1 つのリポジトリで管理 | 速く、1 つの `pnpm install` で両方入る | https://pnpm.io/workspaces |
| Biome | コードの整形 (フォーマッタ) と検査 (リンタ)。禁止 import の検査も | 設定 1 つで速い。層のルールを機械で守れる (D21) | https://biomejs.dev/ |

## frontend

| 名前 | 何に使うか | なぜ選んだか | ドキュメント |
|---|---|---|---|
| React 19 | 画面を作る | 定番で、資料が多い | https://react.dev/ |
| React Router v7 (SPA モード) | 画面の切り替え、`clientLoader` / `clientAction` でのデータ取得 | ログイン情報がブラウザにあるので、ブラウザ側だけで動く SPA にした (D18) | https://reactrouter.com/ |
| Vite | 開発サーバーとビルド | React Router の標準。起動が速い | https://vite.dev/ |
| Tailwind CSS v4 | 見た目 (クラス名でスタイルを書く) | デザイン変数を 1 か所 (`@theme`) にまとめ、並行作業で CSS がぶつからない (D19) | https://tailwindcss.com/docs |
| Motion | ペットの動き (バネ、出入り、ドラッグ) | 素材なしで可愛く動かせる (D20) | https://motion.dev/docs/react |
| canvas-confetti | 紙吹雪の演出 | 1 行で呼べて軽い (D20) | https://github.com/catdad/canvas-confetti |
| 手書き SVG | ペットと着せ替えの絵。パーツ (`<g>`) を重ねる | ライブラリなしで着せ替えができる (D20) | https://developer.mozilla.org/ja/docs/Web/SVG |
| supabase-js | ログイン (Supabase Auth)。publishable キーだけを使う | Supabase 公式のクライアント | https://supabase.com/docs/reference/javascript |
| Hono RPC (`hono/client` の `hc`) | backend の API を型付きで呼ぶ | 型を手で書かずに済み、API とのずれが型エラーになる (D17) | https://hono.dev/docs/guides/rpc |

## backend

| 名前 | 何に使うか | なぜ選んだか | ドキュメント |
|---|---|---|---|
| Hono | API のサーバー | 軽く、Cloudflare Workers で動く。RPC で型を共有できる | https://hono.dev/ |
| Cloudflare Workers | API の置き場所 (予定。Free プラン) | 無料枠で動かせる | https://developers.cloudflare.com/workers/ |
| `@hono/node-server` + tsx | ローカルで API を起動する (`pnpm --filter backend dev`) | Node.js で Hono をそのまま動かせる | https://hono.dev/docs/getting-started/nodejs |
| zod + `@hono/zod-validator` | リクエストの入力検証 (`schemas.ts`) | 検証と型が 1 つの定義で済む | https://zod.dev/ / https://hono.dev/docs/guides/validation |
| supabase-js | DB の読み書き (secret キー) と、トークンの検証 | Workers から HTTP で使える | https://supabase.com/docs/reference/javascript |
| Anthropic SDK (`@anthropic-ai/sdk`) | レシートの AI 判定 (REQ-012)。Claude Haiku に画像を渡し、品目と分類を JSON で受け取る (`modules/receipts/infra/claude.ts`) | 読み取りと分類が 1 回で済み、構造化出力で JSON が壊れにくい (D24)。Workers でも動く | https://docs.claude.com/ |
| Vitest | `modules/*/domain/` と `shared/domain/` の純粋関数のテスト | 設定なしで TypeScript を動かせる。テストは最低限だけ (D12) | https://vitest.dev/ |

## DB とホスティング

| 名前 | 何に使うか | なぜ選んだか | ドキュメント |
|---|---|---|---|
| Supabase (Postgres + Auth + RLS) | DB とログイン | ログインが標準で付き、自分で作る手間を省ける (D04) | https://supabase.com/docs |
| Supabase CLI | ローカルの DB 起動 (`supabase start`)、マイグレーション | 全員が自分の PC で DB を試せる | https://supabase.com/docs/guides/local-development |
| Vercel | frontend の公開 (`staging` と `main` だけ、D13) | 無料枠で手軽に公開できる | https://vercel.com/docs |

## 入れないと決めたもの (見送った技術)

検討したうえで入れなかったものです。出典は [../decisions.md](../decisions.md) (D 番号) と [技術選定の discussion](../specs/2026-11-15-okaimonojyouzu/discussion/tech-stack.md)。
共通の判断基準は「何の問題を解くか」「自前で書くより軽いか」「期限 (約 1 週間) 内に使いこなせるか」です (CLAUDE.md)。
状況が変わって必要になったら、`decisions.md` に新しい行を足してから入れます。

### DB・認証

| 名前 | どんなものか | 見送った理由 | 代わりに |
|---|---|---|---|
| Cloudflare D1 | Cloudflare の SQLite の DB。Workers から直接使える | ログイン (認証) の仕組みが付いておらず、自分で作る必要がある (D04) | Supabase (Postgres + Auth) |
| Firebase | Google の DB + 認証のサービス | 比較の候補として挙げ、Supabase を選んだ (D04)。理由は「認証が標準で付き、工数を省ける」点で Supabase に決めたこと | Supabase |

### frontend の作り

| 名前 | どんなものか | 見送った理由 | 代わりに |
|---|---|---|---|
| SSR + 目印 cookie の回避策 | SSR (サーバー側で画面を作ってから返す方式) のまま、ログイン済みかを cookie で伝えてサーバー側でデータを取る方法 | ログインのセッション (トークン) はブラウザの supabase-js (localStorage) にある。サーバー側の loader はそのトークンを持てず、API を認証付きで呼べない。そのため cookie を使う回避策が要り、仕組みが複雑になる (D18) | SPA モード (`ssr: false`)。データ取得は、ブラウザで動く `clientLoader` / `clientAction` |
| TanStack Query | データ取得とキャッシュのライブラリ | データの取得・更新は React Router の `clientLoader` / `clientAction` で足りる。仕組みを 2 つにしない | `clientLoader` / `clientAction` + `features/*/api.ts` |
| react-hook-form | フォームの状態管理のライブラリ | 入れないと決めた (discussion)。フォームは React Router の `<Form>` / `fetcher` と `logic/` の検証関数で書いている | `<Form>`、`features/*/logic/` |
| 日付ライブラリ (day.js など) | 日付の計算・整形 | 入れないと決めた (discussion)。日本時間の日付の判定は 1 か所の関数にまとめている | `backend/src/shared/domain/date.ts` の `toJstDate()` |
| vite-plugin-pwa | PWA (ホーム画面に追加できる Web アプリ) を作るプラグイン | 入れないと決めた (discussion)。PWA は manifest とアイコンだけで対応する | manifest + アイコン |
| MUI | Google の Material Design の部品集 | Material の見た目が前提で、ゲーム風の見た目にするには上書きが多くなる (D19) | Tailwind v4 の `@theme` + `components/` の共通部品 |
| 素の CSS | クラス名ごとに CSS を書く方法 | 並行開発で CSS がぶつかりやすい (D19) | Tailwind v4 |
| 手書きの型、OpenAPI | API の型を手で書く / 仕様書から型を作る | 型を二重に書くことになり、API とずれても気づきにくい (D17) | Hono RPC (`hc` と `AppType`) |

### ゲーム性 (動き・演出)

| 名前 | どんなものか | 見送った理由 | 代わりに |
|---|---|---|---|
| Rive / Lottie | デザインツールで作ったアニメーションを再生するライブラリ | デザイナーが作る素材ファイルが要り、期限内に用意できない (D20) | Motion + 手書き SVG |
| PixiJS / Spine | Canvas / WebGL で描く 2D ゲーム向けのエンジン | このアプリには過剰で重い (D20、ゲーム設計の discussion) | SVG + Motion |
| Canvas で描く | `<canvas>` に自分で描く方法 | 重い (D22) | SVG のパーツ (`<g>`) を重ねる |
| vaul / use-gesture | 下から出るシート / ジェスチャーのライブラリ | 更新が止まっている (D20) | `components/BottomSheet.tsx` (自前) |

### 開発ツール

| 名前 | どんなものか | 見送った理由 | 代わりに |
|---|---|---|---|
| ESLint + Prettier | 定番のリンタ + フォーマッタ | 2 つの設定が要る。Biome のほうが設定が少なく速い (D21) | Biome |
| 画面・API の網羅的なテスト | E2E テストや API のテストコード | 期限が短く速度を優先。スコアや日付の境界だけは壊れに気づきにくいのでテストする (D12) | `domain/` だけ Vitest。画面と API は動かして確認 |
| dependency-cruiser | import の向き・循環を検査するツール | まだ入れていない。規模が大きくなったら検討する ([../architecture.md](../architecture.md)) | Biome の `noRestrictedImports` |

### そのほか

| 名前 | どんなものか | 見送った理由 | 代わりに |
|---|---|---|---|
| OCR サービス | 画像から文字を読み取るサービス | レシートは、画像を読める AI なら読み取りと分類が 1 回で済む (D24。実装済み、#96) | Claude (Haiku) の画像入力 |
| 常時の位置検知 | アプリを閉じていても入店を検知する | Web アプリではバックグラウンドで位置を取れない (D05) | アプリ起動時に現在地を確認する |
