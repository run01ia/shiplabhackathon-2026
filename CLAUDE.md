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
- **できれば (C)**: 家の食材の在庫管理、レシート OCR・分析。
- **今回はなし**: 何を買ったかの記録。

## ゲーム設計
- ペットを育てる。着せ替えは拡張要素 (参考: Bongo Cat)。
- プラス: 買い物上手スコア、ログインボーナス、リスト作成・閲覧、買い物に行かなかった日。
- マイナス: 予算超過、不要購入、コンビニ立ち寄り。
- ゲーム内通貨で着せ替えアイテムを購入する。

## 詳細ドキュメント (AI はまずここを読む)
- 要件定義 (REQ-001〜013): [docs/specs/2026-11-15-okaimonojyouzu/index.md](docs/specs/2026-11-15-okaimonojyouzu/index.md)
  - 仕様要件: [spec-requirements.md](docs/specs/2026-11-15-okaimonojyouzu/spec-requirements.md)
  - 技術要件: [tech-requirements.md](docs/specs/2026-11-15-okaimonojyouzu/tech-requirements.md)
  - 意思決定記録: [discussion/index.md](docs/specs/2026-11-15-okaimonojyouzu/discussion/index.md)
- チーム・役割分担・スケジュール: [docs/project-overview.md](docs/project-overview.md)
- フェーズ別の予定: [.claude/todo/phase1.md](.claude/todo/phase1.md) 〜 [phase5.md](.claude/todo/phase5.md)
- **作業中タスクの進捗ボード: [.claude/todo/progress.md](.claude/todo/progress.md)**
- docs 全体の目次: [docs/index.md](docs/index.md)

## 技術スタック
- 言語: TypeScript
- フロント: React (ライブラリは各自判断)
- バック: Hono (Cloudflare Workers)。実装前に `npx -y @hono/cli search "<キーワード>"` で公式ドキュメントを引く。詳細は `.claude/skills/hono/SKILL.md`。
- DB: **Supabase** (認証も Supabase Auth を使う)。公式 skill: `.claude/skills/supabase/`, `supabase-postgres-best-practices/`。Workers からは `supabase-js` (HTTP) で接続する。
- デプロイ: Vercel (フロント) / Cloudflare Workers (バック、Free プラン)。公式 skill: `.claude/skills/workers-best-practices/`, `wrangler/`, `workers-development/`, `cloudflare-app-bootstrap/`, `cf-cli/`。

## 開発ルール
- **機能ごとにブランチを切り、PR を出す。** `main` へ直接 push しない。
- ブランチ名: `feat/xxx`, `fix/xxx`, `chore/xxx`, `docs/xxx`
- 日本語でコミュニケーションする。
- GitHub Issue は**現在のフェーズ分だけ**立てる。先のフェーズは `.claude/todo/` に書いておき、着手直前に Issue 化する。

## Skill の自動生成
- 今後も同じような手順を繰り返しそうな作業は、人に言われなくても `.claude/skills/{name}/SKILL.md` として skill 化する。
- 目安: 同じ手順を 2 回以上やった、または今後も繰り返す見込みがある作業 (例: Issue の一括作成、PR 作成、画面追加の定型手順)。
- 作ったら、skill 名と用途を一言で報告する。
- 既存の skill で足りる場合は新規作成せず、既存のものを更新する。
- Unity 用など、このプロジェクトに関係ない skill は作らない。

## 確認の基準 (自律的に進める)
- 基本は**聞かずに進める**。小さな判断は既定値で決め、discussion や PR に記録する。
- 確認するのは次の場合だけ: **セキュリティ** (鍵・認可・個人情報)、**コスト** (課金が発生する選択)、**技術的に大きな決断** (DB・フレームワーク・アーキテクチャの変更)、取り消しにくい外部への操作。
- 迷ったら、推奨案を 1 つ示して進め、結果を簡潔に報告する。

## Issue 駆動開発
- **すべての作業は GitHub Issue から始める。** Issue がなければ先に起票する。Project: https://github.com/users/run01ia/projects/1
- Issue の本文には、AI がすぐ着手できるよう**関連パスを書く**: 該当 REQ-ID (`docs/specs/.../spec-requirements.md`)、関連 discussion (`docs/specs/.../discussion/*.md`)、設計があれば `docs/impl-plan/...` (summary / detailed-design / task)、使う skill、完了の定義。
- 起票するとき、参考になりそうな `docs/` や `.claude/` のパスがあれば、必ず Issue にリンクする。
- ブランチは **`dev` から**切る。PR は **`dev` 向け**で、本文に `Closes #N` を入れる。
- Project のステータスは Ready → In progress → In review → Done。優先度は A=P0、B=P1、C=P2。

## 並列開発 (git worktree)
- 複数のタスクを同時に進める。タスクごとに worktree とブランチを分ける。
  - 作成: `git worktree add ../okaimonojyouzu-wt/{branch-name} -b {type}/{task-slug} origin/dev`
  - 完了後: PR をマージしたら `git worktree remove ../okaimonojyouzu-wt/{branch-name}`
- **親エージェントは、作業開始前に必ず [.claude/todo/progress.md](.claude/todo/progress.md) を読む。** 何が作業中かを確認し、同じタスクの二重着手や同じファイルの衝突を避ける。
- タスクの開始、PR 作成、完了、中断のたびに、親エージェントが `progress.md` を更新する。サブエージェントには更新させない。
- 子エージェントは、割り当てられた worktree の中だけで作業する。

## 予定管理
`.claude/todo/phaseN.md` にフェーズごとのタスクを書く。完了したら `[x]` にする。

| Phase | ゴール |
|---|---|
| 1 | 土台 (環境構築、DB、画面モック、調査、仕様確定) |
| 2 | MVP コア (ログイン、リスト、予算、通貨) |
| 3 | ゲーム化 (ペット、スコア、ポイント付与) |
| 4 | アラート・着せ替え |
| 5 | 仕上げ (デモ動画、発表、C 項目) |

## 今後のスケジュール
- 気になることは Discord で連絡する。
- 次の MTG: 来週水曜 19:00 (難しければ 22:00)。
- 期限: 来週の水曜日まで。
- 最終目標: デモ動画まで用意する。
- DB レビュー、コードレビューは行わない (期限が短いため)。PR は機能単位で出し、各自の判断でマージする。
