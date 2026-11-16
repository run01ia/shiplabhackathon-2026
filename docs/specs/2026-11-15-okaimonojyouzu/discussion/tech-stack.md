# 技術選定

作成日: 2026-11-15
ステータス: 決定

## 論点

DB に何を使うか。他は方針が決まっている。

## 選択肢（任意）

- Supabase (採用)
- Firebase
- Cloudflare D1

## 決定

- 言語: TypeScript
- フロント: React (ライブラリは各自判断)
- バック: Hono (ライブラリは各自判断)
- インフラ: バックエンドは Cloudflare、フロントは Vercel。選定基準は工数とコスト。
- DB: **Supabase** に決定。認証 (REQ-001) も Supabase Auth を使う。理由: 認証が標準で付き、期限 1 週間で自前実装の工数を省ける。Cloudflare の D1 も検討したが、認証を自前で作る必要があるため見送った。
- 注意: Supabase の Free プランは放置すると一時停止する。発表の直前に必ずアクセスして動作確認する。
- Workers からは `supabase-js` (HTTP) で接続する。
- 開発運用: 機能ごとにブランチを作り PR を出す。

## ライブラリ選定レビュー (Fable 5.2、2026-11-16)
結論: 条件付きで、今の選定で進めてよい。採用した対応:
- **ゲーム性**: Motion + canvas-confetti を入れる。着せ替えは手書き SVG のパーツ分け (部位のデータ化で重なりを防ぐ)。目・耳・しっぽは `<g>` に分け、まばたき・しっぽ振り・呼吸を CSS keyframes で付ける。Rive / Lottie (デザイナー製の素材が要る)、vaul / use-gesture (更新が止まっている)、PixiJS / Spine (過剰) は入れない。効果音は余裕があれば `new Audio()`。
- **Biome を採用** (ESLint + Prettier より設定が少なく速い)。禁止 import は `noRestrictedImports` で書ける (feature 間の境界は弱いので grep を併用)。
- **`ssr: false` (SPA モード) に切り替える**。セッションはブラウザ側の supabase-js にあり、サーバー loader から API を認証付きで呼べないため。`clientLoader` / `clientAction` に統一する (別 Issue)。
- **Hono RPC は動く** (誤った body や未知のルートが型エラーになることを確認)。`lib/api.ts` に、`!res.ok` で投げる薄い関数を 1 つ置く。
- **Workers の入口** (`worker.ts`、`wrangler.jsonc`) は環境構築 (#2、ルノリア) の範囲。仮 entry の `wrangler deploy --dry-run` で、724KiB (gzip 170KiB) でバンドルできることを確認済み (Free の上限 3MB)。
- 注意: Workers Free は 1 リクエストあたり外部リクエスト 50 まで。複数の更新は `rpc` にまとめる。
- 入れない: TanStack Query、日付ライブラリ、react-hook-form、`vite-plugin-pwa` (PWA は manifest とアイコンだけ)。
- 整理候補 (低): ルート `package.json` の `@hono/node-server`、`frontend/pnpm-lock.yaml`、2 つの `vercel.json`、Dockerfile (#2 の範囲)。

