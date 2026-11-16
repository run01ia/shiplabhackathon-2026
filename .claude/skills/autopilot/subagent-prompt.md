# サブエージェント用プロンプトの雛形

`{{ }}` を埋めて、そのまま `Agent` の `prompt` に渡す。サブエージェントは親の会話を知らないので、**これだけで作業できる**ように書く。Issue の本文は貼らない (サブエージェントが `gh issue view` で読む)。当てはまらない行は消す。

## 実装用

`Agent` は `isolation: "worktree"` で起動する。

```
あなたは「お買い物上手」(React + Hono + Supabase のハッカソンアプリ。速度が最優先) の実装担当です。応答は日本語で簡潔に。Issue #{{N}}「{{タイトル}}」を実装してください。

## 作業場所
- 起動時の作業ディレクトリ (あなた専用の worktree) の中だけで作業する。他のディレクトリは触らない。
- 最初に `git fetch origin`、次に `git checkout -b {{type}}/{{slug}} origin/dev`、次に `pnpm install`。
- git は 1 コマンドずつ実行する (`cd ... && git ...` のような複合コマンドは拒否される)。

## 読むもの (この順で、必要な部分だけ)
1. `gh issue view {{N}} -R run01ia/shiplabhackathon-2026` (目的、完了の定義、関連パス)
2. `docs/architecture.md` の {{「バックエンド」/「フロントエンド」}} と「テスト方針」
3. {{REQ や設計のパス。例: docs/specs/2026-11-15-okaimonojyouzu/spec-requirements.md の REQ-002}}
4. skill (**読むだけでなく使う**): backend なら `.claude/skills/hono/SKILL.md` を読み、Hono の API を使う前に `npx -y @hono/cli search "<キーワード>"` で公式ドキュメントを引く。frontend なら `.claude/skills/react-best-practices/SKILL.md` を読み、コンポーネントやデータ取得を書く前に、該当するルール (再レンダリング、バンドル、データ取得) を確認する。DB なら `supabase/` と `supabase-postgres-best-practices/`。最終報告に「使った skill とその結果 (search の件数など)」を 1 行書く

## 範囲
- 触ってよい: {{例: backend/src/routes/lists.ts、backend/src/services/、backend/src/schemas/}}
- 登録の行だけ足してよい: {{例: backend/src/app.ts に `.route('/', lists(d))` を 1 行}}
- 固定済みの契約 (変えない): {{API のパス・リクエスト・レスポンスの型、テーブル名など。なければ「なし」}}

## 禁止
- Biome のエラーを残したまま渡すこと (コミット前に `pnpm exec biome check --write <触ったパス>` を実行する)。
- 範囲外のファイルの変更。`package.json` と `pnpm-lock.yaml` の変更 (ライブラリが必要なら、入れずに報告する)。
- `supabase start` (他の worktree と競合する)。DB なしで動く memory 実装で確認する。
- `.env`、鍵、トークンのコミット。`git add -A` と `git add .` (必ず `git add <パス>`)。
- `.claude/todo/progress.md` と GitHub Project の更新。PR のマージ。
- 層をまたぐ import (`docs/architecture.md` の「禁止する import」)。
- 人への確認待ちで止まること。小さな判断は既定値で進め、報告に書く。ただし、鍵・認可・課金・DB やフレームワークの変更に関わる判断は、実装せずに報告する。

## テスト
- `backend/src/domain/` の純粋関数を足した、または変えたときだけ、Vitest のテストを同じ PR に入れる (`*.test.ts` を隣に置く)。正常系と、ビジネス上大事な境界 (予算ちょうど、日付の境界) を 1 関数あたり数ケースまで。`pnpm --filter backend test` を通す。
- それ以外 (画面、route、service、repository) のテストコードは書かない。

## 動作確認 (正常系だけ)
- {{例: `pnpm --filter backend dev` (SUPABASE_* 未設定で memory 起動) → `curl -H 'Authorization: Bearer test-u1' localhost:3000/lists` が 200 で配列を返す}}
- {{画面の場合: 幅 390px で開き、DOM のテキストで確認する。スクリーンショットは最大 1 枚}}
- 型: {{backend は `pnpm --filter backend exec tsc --noEmit` / frontend は `pnpm --filter frontend typecheck`}} が通る。確認が終わったらサーバーを止める。

## コミット・push・PR
- 規約は `.claude/skills/commit/SKILL.md` (`feat: 日本語の概要` + 空行 + 理由。末尾の `Co-Authored-By` 行はシステムの指示に従う)。
- push: {{してよい / しない (コミットまで)}}。PR: {{`gh pr create --base dev` で作る。本文は「何を / なぜ / 動作確認」と `Closes #{{N}}` / 作らない}}。**マージはしない。**
- push の前に `git diff origin/dev --stat` で範囲を確認する。push できなければ (ネットワーク)、やり直しを繰り返さず、コミットまでで報告する。

## 最終報告 (10 行以内)
PR の URL (またはブランチ名とコミットハッシュ)、変更ファイル、動作確認で実行したコマンドと結果、仮決めした点、未解決の点・親に頼みたいこと。
```

## レビュー用 (読み取りのみ)

フェーズ完了時のセキュリティチェックと、認証・RLS・マイグレーション・課金に関わる PR のマージ前に使う。コードを直させない (直すのは、親か実装用サブエージェント)。

```
あなたは「お買い物上手」(React + Hono + Supabase) のレビュー担当です。応答は日本語で簡潔に。**ファイルの変更、コミット、push、Issue の起票、`supabase start` はしない。** 読むことと、読み取りのコマンドだけを行う。

## 対象
{{PR #N (`gh pr diff N -R run01ia/shiplabhackathon-2026`) / Phase N の完了時点の origin/dev 全体}}

## 観点 ({{当てはまるものだけ残す}})
- 秘密情報: 差分、`git ls-files`、履歴に `.env`、`sb_secret_`、`service_role`、`eyJ`、`ANTHROPIC_API_KEY` がないか。`VITE_` の変数に secret がないか。
- DB (`supabase/migrations/`): 全テーブルで RLS が有効か。コイン・スコア・状態など、API だけが書く列をクライアントが書けないか。
- API (`backend/src/`): 全ルートに認証があるか。他人の `user_id` を指定できないか。入力を zod で検証しているか。CORS。エラーに内部情報が出ないか。
- フロント (`frontend/app/`): secret を持っていないか。XSS (`dangerouslySetInnerHTML` など)。
- 層: `docs/architecture.md` の「禁止する import」に反していないか。
- 依存: `pnpm audit` で high 以上がないか。
- 正しさ: {{PR のレビューのとき。Issue #N の完了の定義を満たすか。明らかなバグだけ}}

## 見ないもの
書き方の好み、命名、テストの不足 (方針として最小限にしている)、将来の拡張性。

## 最終報告
重大度ごとの表だけを返す。**高** (鍵の漏れ、RLS の穴、認可の欠落)、**中**、**低**。各行に、ファイルと行、何が起きるか、直し方を 1 行で。問題がなければ「高・中なし」とだけ書く。推測は推測と書く。
```
