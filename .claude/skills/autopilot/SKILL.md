---
name: autopilot
description: Issue の起票から、並行性の判断、要件確認、設計、実装、PR、自動マージ、Project 更新までを人の確認なしで回す。「どんどん進めて」「Issue を片付けて」「自動で進めて」といった依頼で使う。
---

# autopilot

Issue 駆動で、**起票 → 並行性の判断 → 設計 → 並行実装 → PR → 自動マージ → 進捗更新 → スモーク確認**を親エージェントが回す。人に聞くのは「8. 止まる条件」だけ。それ以外は既定値で進め、Issue / PR に 1 行で記録する。

## 親のチェックリスト

- **起動前**: ① `progress.md` と Project を読む ② `git fetch origin` ③ 波を決める (触るファイルと依存が重ならないこと) ④ 依存の追加と共通の型・登録は、親が先に 1 本の PR で `dev` に入れる ⑤ Status=`In progress`、`progress.md` に波を書く ⑥ [subagent-prompt.md](subagent-prompt.md) を埋めて、1 メッセージで同時に起動する。
- **マージ前 (PR ごと)**: ① 差分が Issue の範囲内か ② 秘密情報がないか ③ 層をまたぐ禁止 import がないか ④ 動作確認の結果が報告にあるか (`domain/` を変えたならテストが通っているか)。1 つでも欠けたらマージしない。
- **波の終わり**: ① 依存元 → 依存先の順でマージ ② **Issue を閉じて Project を Done にする** (`set-status.sh N Done "PR #M でマージ"`。`dev` へのマージでは `Closes #N` が効かず、自動では閉じない) ③ worktree を片付ける ④ `progress.md` を更新 (完了、ブロッカー、再開メモ) ⑤ スモーク確認を 1 本 ⑥ DB を変えた波なら、親が `supabase start` で統合確認を 1 回。
- **フェーズ完了時**: ① `phaseN.md` を `[x]` に ② レビュー用サブエージェントでセキュリティチェック ③ 「高」は直るまで次へ進まない ④ 次のフェーズを Issue 化する。

## 0. 前提

- 進捗の正は Issue と Project (https://github.com/users/run01ia/projects/1)。`.claude/todo/progress.md` は、ブロッカーと再開メモの補助。**着手・PR・マージ・中断のたびに親が更新する** (コンテキストが圧縮されても再開できるようにする)。サブエージェントには更新させない。
- ブランチは `origin/dev` から切り、PR のベースは `dev`。`staging` と `main` へのマージは、デプロイを伴うので自動にしない。
- **他の人の担当は取らない。** 担当者が付いた Issue と、その範囲のコードには着手しない。現在の例: #2 環境構築 = ルノリア、#6 位置情報 = ゆうと (アラートの検知 REQ-009/010/011 と、スーパー登録 `/stores` を含む)、#8 スコア・ポイントの仕様 = ゲーム担当。待ちになる作業は、`progress.md` のブロッカーに書く。

## 1. 起票

Issue がなければ先に作る。本文をファイルに書き、次を実行する (Project への追加、Status / Priority / Size の設定まで行う)。

```
.claude/skills/autopilot/new-issue.sh "タイトル" 本文ファイル P0|P1|P2 XS|S|M|L Ready [assignee] ["Phase N: 名前"]
```

本文に書くこと (サブエージェントが Issue だけで着手できるようにする):
- 目的と完了の定義 (画面または API で確認する正常系)
- 関連パス: REQ-ID、discussion、`docs/impl-plan/`、使う skill
- 触るファイル範囲 (ディレクトリ単位) と、`依存: #N` (なければ「なし」)

Issue 化するのは現在のフェーズ分だけ。先の分は `.claude/todo/phaseN.md` に書く。

## 2. 並行性の判断 (親が決める)

Ready の Issue を、触るファイル範囲と依存から「波」に分ける。1 Issue = 1 サブエージェント = 1 worktree。並行数に上限はない。

- **同じ波**: 触るファイルが重ならず、互いの出力に依存しない。front と back は、API の契約 (パス・リクエスト・レスポンスの型) が固定済みなら並行にできる。
- **波を分ける**: `依存: #N` が未完了、マイグレーションや共通の型を前提にする、同じファイルを変える。
- **直列**: マイグレーションの追加は 1 本ずつ (番号の衝突を避ける)。
- **競合しやすいファイル**: `backend/src/app.ts` と `deps.ts` への登録、`frontend/app/routes.ts`、`package.json`、`pnpm-lock.yaml`。依存の追加は、親が波の前に 1 本の PR で入れる。登録の行は、どのサブエージェントがどこに足すかをプロンプトで指定する。

## 3. 設計 (Issue の大きさで選ぶ)

- **小さい** (1 画面、1 API、数ファイル): Issue のコメントに 5〜10 行 (変更ファイル、API の型、処理の流れ) を書いて実装へ進む。
- **大きい** (複数の REQ にまたがる): `design-flow` skill で `docs/impl-plan/` を作ってから実装する。
- 要件が足りなければ `new-spec` で REQ を追記し、仮決めを discussion に記録する。

## 4. 実装 (サブエージェントに委任)

波ごとに、1 メッセージで同時に `Agent` を起動する。プロンプトは [subagent-prompt.md](subagent-prompt.md) の雛形を埋めて、自己完結させる (サブエージェントは、この会話の内容を知らない)。

- **worktree**: `Agent` の `isolation: "worktree"` を使う (`.claude/worktrees/` に自動で作られる。`.gitignore` 済み)。サブエージェントが最初に `origin/dev` から作業ブランチを切る。
- **隔離は場所を保証しない**: `isolation: "remote"` でも、この Mac のローカル worktree で動くことがある。ネットワークが切れると push と PR ができない。その場合は、サブエージェントはコミットまでで報告し、親が後で push する。
- **DB**: `supabase start` は、複数の worktree で同時に動かせない (ポートとコンテナ名が競合する)。サブエージェントは memory 実装で確認する (`SUPABASE_*` が未設定なら backend は memory で起動する。トークンは `test-<userId>`)。
- **依存の追加**: サブエージェントには追加させない。必要になったら報告させ、親が入れる。
- サブエージェントが失敗、または報告が不十分なときは、`SendMessage` で 1 回だけ追加の指示を出す。それでもだめなら、Issue を Ready に戻し、`progress.md` のブロッカーに書いて次へ進む。

## 5. PR と自動マージ (親が行う)

サブエージェントは push と PR 作成まで行い、**マージはしない**。親が PR ごとに次を確認する (worktree の中で実行する)。

```
gh pr diff N --name-only                                   # 範囲外のファイル、.env がないか
gh pr diff N | grep -nE '^\+.*(sb_secret_|service_role|eyJ[A-Za-z0-9_-]{20}|API_KEY=.)'   # 秘密情報 (ヒットしたら中身を見る)
pnpm exec biome check backend biome.json                    # 禁止 import (noRestrictedImports で機械的に検出)
```

- 禁止 import の全体は [docs/architecture.md](../../../docs/architecture.md)。`domain/` を変えた PR は `pnpm --filter backend test` が通っていること。
- 問題なければ `gh pr merge N --merge`。順序は**依存元 (DB、共通の型) → 依存先**。競合したら、その worktree で `origin/dev` を取り込んで直し、動作確認をやり直してからマージする。
- **マージ後は、親が必ず Issue を閉じて Project を Done にする。** 既定ブランチが `main` なので、`dev` 向けの PR の `Closes #N` では Issue が閉じず、Project も Done にならない (実際に #17〜#20、#31 が OPEN のまま残った)。`.claude/skills/autopilot/set-status.sh N Done "PR #M でマージ"` が両方を行う (中身は `gh issue close N -c "..."` と Status の更新)。波の終わりに `gh issue list --state open` で閉じ忘れがないかを見る。
- そのあと `git worktree remove <パス>` で片付け、`progress.md` を更新する。
- 動作確認に失敗、または秘密情報が混ざっていたら、マージしない。同じサブエージェントに `SendMessage` で直させる。
- 認証、RLS、マイグレーション、課金に関わる PR は、マージ前にレビュー用サブエージェント (雛形あり) に見せてよい。それ以外は、上の確認だけでマージする (速度優先)。

ステータスの更新: `.claude/skills/autopilot/set-status.sh <Issue番号> "In progress"|"In review"|Done|Ready|Backlog`

## 6. 画面スモーク確認 (波の区切り)

波のマージ後に、**主要な流れ 1 本だけ**を確認する (例: ログイン → リスト作成 → 買い物中 → 結果)。全画面は見ない。

- 手段の優先順: ① `npx -y @hono/cli request` で API ② ブラウザの `javascript_tool` で DOM のテキストと要素の有無 ③ スクリーンショットは最後に 1〜2 枚 (`scale: 0.4` 以下)。失敗したときだけ、原因の周辺を 1 枚足す。
- ブラウザ操作は `browser_batch` で 1 回にまとめる。起動は `pnpm dev` (front 5173、back 3000)。終わったらサーバーを止め、タブを閉じる。
- **DB の統合確認**は、マイグレーションか `repositories/supabase/` を変えた波だけ、親が `supabase start` で 1 回行う。
- 結果は Issue か PR に 1 行で残す。失敗したら、新しい Issue を起票して直す。
- 重い確認 (全画面、実機、位置情報) は人に頼むか、フェーズの最後に 1 回だけ行う。

## 7. フェーズ完了時のセキュリティチェック

`.claude/todo/phaseN.md` のタスクがすべてマージされたら、次のフェーズへ進む前に、レビュー用サブエージェント (読み取りのみ) に確認させる。観点:

- **秘密情報**: `git ls-files` と履歴に `.env`、`sb_secret_`、`service_role`、`eyJ`、`ANTHROPIC_API_KEY` がないか。`VITE_` に secret を入れていないか。
- **DB**: 全テーブルで RLS が有効か。クライアントが書き換えてはいけない列 (コイン、スコア、状態) を拒否できているか。
- **API**: 全ルートに認証があるか。他人の `user_id` を指定できないか。入力を zod で検証しているか。CORS は必要な Origin だけか。エラーに内部情報が出ていないか。
- **フロント**: secret を持っていないか。`dangerouslySetInnerHTML` などの XSS がないか。
- **依存**: `pnpm audit` で high 以上がないか。

結果は重大度 (高 / 中 / 低) 別に Issue にする。**高は直るまで次のフェーズに進まない** (`progress.md` のブロッカーに書く)。RLS を実際に攻撃して試す確認は、親が `supabase start` で行う。

その後、`staging` への PR を親が作る (`dev → staging`)。マージはデプロイを伴うので、人に確認する。

## 8. 止まる条件 (人に聞く)

- **セキュリティ** (鍵・認可・個人情報)、**コスト** (課金が発生する選択)、**技術的に大きな決断** (DB・フレームワークの変更)、**取り消しにくい外部操作** (`staging` / `main` へのマージ、本番データの変更、force push)。
- 操作が権限の確認で拒否されたとき。**言い換えて繰り返さない。** 何をしたかったかと理由を伝え、許可の方法を聞く。
- 要件どうしが矛盾し、どちらを取るかで画面や DB が大きく変わるとき。

聞いている間も、関係のない Issue は進める。待ちの内容は `progress.md` のブロッカーに書く。

## 9. 次の波へ

`git fetch origin` して 2 に戻る。Ready がなくなったら、`docs/specs/` と `.claude/todo/phaseN.md` から足りない作業を起票して続ける。新しく分かった作業は、その場で `phaseN.md` に足して起票してよい。

## 落とし穴 (実際に起きたこと)

- `git add -A .claude` で、worktree が埋め込みリポジトリとして誤コミットされかけた。**`git add <パス>` で対象を指定する。**
- macOS の bash は 3.2。`declare -A` などの bash 4 の機能をスクリプトで使わない。
- worktree で隔離されたエージェントは、`cd ... && git ...` のような複合コマンドを拒否される。git は 1 コマンドずつ実行する。
- `gh project item-list` の既定は 30 件まで。`--limit 200` を付ける (`set-status.sh` は対応済み)。
