# お買い物上手 (okaimonojyouzu)

実店舗特化の購入抑制アプリ。買い物リストと予算を事前に決め、守れたらプラス、破ったらマイナスとしてゲーム化する。ペットを育て、着せ替えで拡張する。

## ペルソナ

- 20代の大学生・新社会人。一人暮らしで、誰にも相談せずに買えてしまう環境。
- 自己管理は苦手だが、支出管理の意識はある。面倒でサボりがち。
- 入力の手間は最小限にする。マイナス要素が前提のプロダクトなので、プラスを得やすくする設計にする。

## 解決したい課題

- 来店中: セール品やコスパ感で不要なものを買う。予定品より安売り品を優先して大量に買う。
- 来店前: 空腹で買う。コンビニに何となく寄る。家の食材を把握できず重複して買う。

## 優先度 (A / B / C)

- **絶対 (A)**: 買い物リストと予算の作成、プラス・マイナスのゲーム化、位置情報によるアラートで購入抑制する。
- **できれば (C)**: 家の食材の在庫管理、レシートの AI 判定 (画像を読めるAIで分類しスコアに反映)。
- **今回はなし**: 何を買ったかの記録。

## ゲーム設計

- ペットを育てる。着せ替えは拡張要素 (参考: Bongo Cat)。
- プラス: 買い物上手スコア、ログインボーナス、リスト作成・閲覧、買い物に行かなかった日。
- マイナス: 予算超過、不要購入、コンビニ立ち寄り。
- ゲーム内通貨で着せ替えアイテムを購入する。

## 詳細ドキュメント (AI はまずここを読む)
- **意思決定記録 (なぜその選択をしたか): [docs/decisions.md](docs/decisions.md)**。重大な決定 (技術選定、仕様の変更、方針の転換) をしたら、**1 行で追記する** (理由と見送った案。覆したら行を消さずに状態を変える)。

- 要件定義 (REQ-001〜013): [docs/specs/2026-11-15-okaimonojyouzu/index.md](docs/specs/2026-11-15-okaimonojyouzu/index.md)
  - 仕様要件: [spec-requirements.md](docs/specs/2026-11-15-okaimonojyouzu/spec-requirements.md)
  - 技術要件: [tech-requirements.md](docs/specs/2026-11-15-okaimonojyouzu/tech-requirements.md)
  - 意思決定記録: [discussion/index.md](docs/specs/2026-11-15-okaimonojyouzu/discussion/index.md)
- チーム・役割分担・スケジュール: [docs/project-overview.md](docs/project-overview.md)
- フェーズ別の予定: [.claude/todo/phase1.md](.claude/todo/phase1.md) 〜 [phase5.md](.claude/todo/phase5.md)
- **ブロッカーと再開メモ: [.claude/todo/progress.md](.claude/todo/progress.md)** (進捗の正は GitHub の Issue と Project)
- **アーキテクチャ (React + Hono の構成、層、テスト方針、ブランチとデプロイ): [docs/architecture.md](docs/architecture.md)**
- docs 全体の目次: [docs/index.md](docs/index.md)

## 画面・デザインの前提 (スマホアプリ)

- **スマホ (縦持ち) 前提の Web アプリ / PWA。** PC 表示は考慮しない (PC で開いた場合は、中央にスマホ幅で表示する)。
- 基準サイズ: **幅 390px × 高さ 844px** (iPhone 14/15 相当)。最小は幅 360px。横スクロールは出さない。
- モバイルファースト: CSS は小さい画面を基準に書く。画面の高さは `100dvh` を使う。
- タップ領域は **44×44px 以上**。本文は 16px 以上 (iOS で入力欄が拡大されないため)。
- セーフエリア (ノッチ、ホームバー) を `env(safe-area-inset-*)` で考慮する。
- ナビは**画面下のタブ** (ホーム / リスト / ショップ)。親指で届く範囲に主要ボタンを置く。
- 画面モックも同じサイズ (幅 390px) で作る。PC ブラウザで見るときはスマホ幅の枠で表示する。
- 位置情報と通知はブラウザの許可が要る。許可が拒否された場合の表示も用意する。

## 技術スタック

- 言語: TypeScript
- フロント: React (ライブラリは各自判断)。実装前に `.claude/skills/react-best-practices/` (Vercel 製の React の性能ルール) を使う
- バック: Hono (Cloudflare Workers)。実装前に `npx -y @hono/cli search "<キーワード>"` で公式ドキュメントを引く (`.claude/skills/hono/SKILL.md`)。
- ゲーム性 (キャラの動き・演出): **Motion** (バネ・出入り・ドラッグ) と **canvas-confetti** (紙吹雪)。着せ替えは、手書き SVG をパーツ (`<g>`) に分けて重ねる (ライブラリなし)。Rive / Lottie / PixiJS / vaul は入れない (素材と学習コストが期限に合わない)。
- フォーマッタ・リンタ: **Biome**。**コミット前に `pnpm exec biome check --write <触ったパス>`** (全体は `pnpm check`)。エラーは直す。直せない理由があるときだけ `biome-ignore` に理由を書く。
- DB: **Supabase** (認証も Supabase Auth)。Workers からは `supabase-js` (HTTP) で接続する。skill: `.claude/skills/supabase/`, `supabase-postgres-best-practices/`。
- デプロイ: Vercel (フロント) / Cloudflare Workers (バック、Free プラン)。skill: `.claude/skills/workers-best-practices/`, `wrangler/`, `workers-development/`, `cloudflare-app-bootstrap/`, `cf-cli/`。

## 開発ルール (要点。手順は skill に置く)

**メンバーが実装する Issue**: 「あったらいい機能」の一部は、チームメンバーが実装する (ラベル `good first issue`、milestone「追加機能」)。**AI は着手しない。** 思いついた小さな付加機能は、自分で作らず、この形で起票する。タイトル・本文・コミット・PR では、他の Issue と区別する言葉を付けず、普通の機能として書く。

### 確認の基準 (自律的に進める)

- 基本は**聞かずに進める**。小さな判断は既定値で決め、Issue / PR / discussion に 1 行で記録する。迷ったら、推奨案を 1 つ選んで進める。
- 人に聞くのは次だけ: **セキュリティ** (鍵・認可・個人情報)、**コスト** (課金が発生する選択)、**技術的に大きな決断** (DB・フレームワークの変更)、**取り消しにくい外部操作** (`staging` / `main` へのマージ、本番データの変更)。
- 操作が権限の確認で拒否されたら、言い換えて繰り返さない。何をしたかったかと理由を伝え、許可の方法を聞く。

### Issue 駆動とブランチ

- **すべての作業は GitHub Issue から始める。** なければ先に起票する (`.claude/skills/autopilot/new-issue.sh`)。Issue 化するのは現在のフェーズ分だけ。
- Issue の本文には、関連パス (REQ-ID、discussion、`docs/impl-plan/`、使う skill)、触るファイル範囲、依存、完了の定義を書く。
- ブランチは `feat/* → dev → staging → main`。`origin/dev` から `feat/xxx` `fix/xxx` `chore/xxx` `docs/xxx` を切り、PR は `dev` 向け。`staging` と `main` だけデプロイする ([docs/architecture.md](docs/architecture.md))。
- コミットは `commit` skill、PR は `pr` skill。**`git add -A` と `git add .` は使わず、`git add <パス>` で指定する。**
- 日本語でコミュニケーションする。

### 自動ワークフロー (autopilot)

「起票 → 並行性の判断 → 設計 → 並行実装 → PR → 自動マージ → 進捗更新 → スモーク確認」を、人の確認なしで回す。**手順とチェックリストは [.claude/skills/autopilot/SKILL.md](.claude/skills/autopilot/SKILL.md)**、サブエージェントへの指示は [subagent-prompt.md](.claude/skills/autopilot/subagent-prompt.md)。

- 並行性は、Issue の内容 (触るファイル範囲、依存) から**親エージェントが判断**する。1 Issue = 1 サブエージェント = 1 worktree。
- **他の人の担当は取らない** (例: #2 環境構築 = ルノリア、#6 位置情報とアラートの検知 REQ-009/010/011・スーパー登録 `/stores` = ゆうと、#8 スコア・ポイントの仕様 = ゲーム担当)。
- `dev` 向けの PR は、動作確認が通っていれば**親が自動マージ**する。サブエージェントはマージしない。`staging` と `main` は自動にしない。`dev` へのマージでは `Closes #N` が効かないので、マージ後に親が Issue を閉じて Project を Done にする。
- 人のコードレビューと DB レビューは行わない (期限が短いため)。代わりに、親がマージ前に、差分の範囲・秘密情報・禁止 import・動作確認の結果を見る。
- 波の区切りに、主要な流れ 1 本だけを画面と API で確認する (DOM のテキスト中心、スクリーンショットは 1〜2 枚)。
- **フェーズが終わるたびに、セキュリティチェックを挟む。** 高 (鍵の漏れ、RLS の穴、認可の欠落) は、直るまで次のフェーズに進まない。

### 進捗とブロッカー

- **進捗の正は GitHub の Issue と [Project](https://github.com/users/run01ia/projects/1)。** ステータスは Ready → In progress → In review → Done。優先度は A=P0、B=P1、C=P2。更新は `.claude/skills/autopilot/set-status.sh <Issue番号> <ステータス>`。
- [.claude/todo/progress.md](.claude/todo/progress.md) は、**ブロッカーと再開メモ**の補助。親エージェントは作業前に読み、着手・PR・マージ・中断のたびに更新する (サブエージェントには更新させない)。**止まっている理由は、必ず「ブロッカー」表に書く。**
- フェーズ = `.claude/todo/phaseN.md`。完了したら `[x]` にする。新しいタスクは、聞かずにそこへ追加してよい (必要なら Issue も起票する)。

| Phase | ゴール                                          |
| ----- | ----------------------------------------------- |
| 1     | 土台 (環境構築、DB、画面モック、調査、仕様確定) |
| 2     | MVP コア (ログイン、リスト、予算、通貨)         |
| 3     | ゲーム化 (ペット、スコア、ポイント付与)         |
| 4     | アラート・着せ替え                              |
| 5     | 仕上げ (デモ動画、発表、C 項目)                 |

### テスト (最低限だけ書く)

- 書くのは**コアなドメイン (`backend/src/domain/` の純粋関数: スコア計算、報酬判定、JST の日付) だけ**。Vitest で、正常系とビジネス上大事な境界 (予算ちょうど、日付の境界) を 1 関数あたり数ケースまで。
- 画面、DB、API の網羅的なテストと、重箱の隅を突くテストは書かない。それ以外は、画面または API で正常系を確認する。詳細は [docs/architecture.md](docs/architecture.md) の「テスト方針」。

### ライブラリとアーキテクチャ

- ライブラリは**意欲的に検討する**が、**導入を目的にしない。** 「何の問題を解くか」「自前で書くより軽いか」「期限内に使いこなせるか」を確認し、理由を Issue / PR に 1〜2 行で残す。
- **backend は feature モジュール + use-case 層** (`backend/src/modules/<機能>/` に `routes.ts` (controller を兼ねる) / `usecases/` (1 操作 = 1 ファイル) / `repository.ts` (interface) / `infra/` (supabase・memory)、純粋関数は `domain/`、共通は `shared/`)。依存は `routes → use-case → repository (interface) ← infra` の一方向で、他モジュールは `repository.ts` だけ import できる。**禁止 import は Biome (`noRestrictedImports`) が検査する。** 1 ファイル約 120 行まで。`(c: Context) => ...` だけの controller の切り出しは禁止 (必要なら `createFactory().createHandlers`)。詳細は [docs/architecture.md](docs/architecture.md) の「バックエンド」。
- [アーキテクチャ](docs/architecture.md)は目安。合わなくなったら変えてよい (同じ PR で `docs/architecture.md` を直し、変更履歴に理由を書く)。責務の分離とテストのしやすさは崩さない。
- 依存の追加は、並行作業の前に親が 1 本の PR で入れる (`package.json` と `pnpm-lock.yaml` の競合を避ける)。

### アドバイザーとコンテキスト

- **Fable 5.2 (`claude-fable-5-2`) を積極的に使ってよい** (ユーザーの指示、2026-11-16)。困ったときのアドバイザー (`.claude/settings.json` の `advisorModel`) に加え、**サブエージェントの `model: "fable"`** として、次の仕事に使う:
  - 設計・アーキテクチャ・技術選定、そのレビュー
  - ゲーム性 (キャラの動き、演出、着せ替え) など、質で差が出る実装
  - フェーズ完了時のセキュリティチェック、大きめの PR のレビュー
  - 2〜3 回失敗した問題の調査
  - 定型の実装 (CRUD 画面のつなぎ込みなど) は、通常のモデルでよい。相談するときは、状況・試したこと・知りたいことを 3〜5 行にまとめる。助言は参考で、最終判断は自分で行う。
- コンテキストは使用率 **70%** で自動圧縮される (`.claude/settings.json` の `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`)。圧縮されても続けられるよう、状態は Issue / Project / `progress.md` に書き出しておく。

### ルールと skill を自分で育てる

- 開発の進め方で新しく決まったことは、聞かれなくても**自分でこのファイルに追記する**。ここには要点とリンクだけを書き、手順は `.claude/skills/` か `docs/` に置く。
- 同じ手順を 2 回以上やった、または今後も繰り返す作業は、`.claude/skills/{name}/SKILL.md` にする (既存の skill で足りるなら、それを更新する)。作ったら、名前と用途を一言で報告する。このプロジェクトに関係ない skill は作らない。

## 今後のスケジュール

- 気になることは Discord で連絡する。
- 次の MTG: 来週水曜 19:00 (難しければ 22:00)。
- 期限: 来週の水曜日まで。
- 最終目標: デモ動画まで用意する。
