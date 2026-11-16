---
name: autopilot
description: Issue の起票から、並行性の判断、要件確認、設計、実装、PR、自動マージ、Project 更新までを人の確認なしで回す。「どんどん進めて」「Issue を片付けて」「自動で進めて」といった依頼で使う。
---

# autopilot

Issue 駆動で、**起票 → 並行性の判断 → 要件・設計 → 並行実装 → PR → 自動マージ → 進捗更新**を自律的に回す。人に確認するのは、セキュリティ・コスト・技術的に大きな決断だけ (`CLAUDE.md` の「確認の基準」)。

## 0. 前提
- 親エージェントは作業前に `.claude/todo/progress.md` と Project (https://github.com/users/run01ia/projects/1) を読む。
- 進捗の更新コマンドと ID は `CLAUDE.md` の「進捗の更新」を使う。
- ブランチは `origin/dev` から切り、PR のベースは `dev`。**`main` は自動マージしない。**

## 1. 起票
作業が Issue になっていなければ、先に起票する (`gh issue create`)。本文に必ず書く:
- 目的と完了の定義 (画面または API で確認する正常系)
- **関連パス**: 該当 REQ-ID (`docs/specs/.../spec-requirements.md`)、discussion、`docs/impl-plan/`、使う skill、触るディレクトリ
- **依存**: `依存: #N` (なければ「なし」)
- **触るファイル範囲**: `frontend/` `backend/` `supabase/` `docs/` のどれか
Project に入れ、Status=Ready、Priority (A=P0 B=P1 C=P2)、Size を付ける。

## 2. 並行性の判断 (自分で決める)
Ready の Issue (他の人が担当していないもの) を集め、次の規則で「波」に分ける。
- **同じ波に入れてよい**: 触るファイル範囲が重ならず、互いの出力に依存しない。front と back は、API の契約 (パス・リクエスト・レスポンスの型) が固定済みなら並行にできる。
- **波を分ける**: DB のマイグレーションに依存する、共通の型・設定を先に作る必要がある、同じファイルを変える、`依存: #N` が未完了。
- **直列にする**: マイグレーションの追加は 1 本ずつ (番号の衝突を避ける)。
- 担当者が他の人の Issue (例: #2 ルノリア) には着手しない。
- 1 つの波の並行数は、衝突しない範囲で上限なし。ただし 1 Issue = 1 サブエージェント = 1 worktree。

## 3. 要件・設計 (Issue の大きさで選ぶ)
- **小さい Issue** (1 画面、1 API、数ファイル): 要件は REQ-ID を参照するだけ。設計は Issue のコメントに 5〜10 行 (変更ファイル、API の型、処理の流れ) を書いて実装へ進む。
- **大きい Issue** (複数 REQ、複数ファイルにまたがる): `design-flow` skill で `docs/impl-plan/` を作り、設計完了レポート (アーティファクト) を出してから実装する。
- 要件が足りなければ `new-spec` で REQ を追記し、discussion に仮決めを記録する。

## 4. 実装 (サブエージェントに委任)
波ごとに、**1 メッセージで同時に** `Agent` を起動する (`run_in_background: true`)。事前に worktree を作る:
```
git fetch origin
git worktree add ../okaimonojyouzu-wt/{branch-name} -b {type}/{task-slug} origin/dev
```
サブエージェントへのプロンプトに含める (自己完結させる):
1. 作業場所 (worktree の絶対パス)。**その中だけで作業**し、本体や他の worktree は触らない。
2. Issue 番号と本文、関連パス (読むべきファイル)。
3. 使う skill (`hono` `supabase` `workers-best-practices` など)。実装前に読むこと。
4. 画面前提 (`CLAUDE.md` の「画面・デザインの前提」)、**テストコードは書かない**。
5. 動作確認: 画面または API (`npx -y @hono/cli request`、ブラウザ) で正常系を確認し、結果を報告する。
6. コミット規約 (`commit` skill)。`git add -A` は使わない。末尾に `Co-Authored-By` 行。
7. **push しない** (親が行う)。`progress.md` と Project は更新しない (親が更新する)。
8. 最終報告は簡潔に: 変更ファイル、動作確認の結果、コミットハッシュ、未解決の点。

## 5. PR と自動マージ (親エージェントが行う)
サブエージェントの完了後、親が:
1. worktree で `git diff origin/dev --stat` を確認し、範囲外の変更や秘密情報 (`.env`、キー) が混ざっていないか見る。
2. `git push -u origin <branch>`。`pr` skill で `dev` 向けに PR を作る (`Closes #N`)。Status=`In review`。
3. **動作確認に失敗している、または秘密情報が混ざっていれば、マージしない。** 直して再確認する。
4. 問題なければ `gh pr merge <N> --merge` で**自動マージ**する。競合したら、worktree で `origin/dev` を取り込んで解消し、再 push してからマージする。
5. マージ後: Issue が閉じて Status=`Done` になったことを確認 (ならなければ手で更新)。worktree を `git worktree remove` で片付け、`progress.md` の完了表に移す。

マージの順序: 依存元 (DB、共通の型) → 依存先。同じ波の中で衝突したら、後のものを `origin/dev` に合わせ直す。

## 5.5 画面スモーク確認 (波の区切りで軽く)
波のマージごと (または画面・APIが動くようになったとき) に、**正常系が画面で動くか**を最小限の手数で確認する。トークンを使いすぎないこと。
- 対象は**主要な流れ 1 本だけ** (例: ログイン → リスト作成 → 買い物中 → 結果)。全画面を毎回見ない。
- 手段の優先順: ① `npx -y @hono/cli request` で API の正常系 → ② ブラウザの `javascript_tool` で DOM のテキスト・要素の有無を確認 → ③ スクリーンショットは**最後に 1〜2 枚だけ** (`scale: 0.4` 以下、`zoom` で一部だけ)。
- ブラウザ操作は `browser_batch` で 1 回にまとめる。**スクリーンショットを何枚も撮らない。** 失敗したときだけ、原因の周辺を 1 枚足す。
- 起動は `pnpm dev` (front 5173、back 3000)。確認後は必ずサーバーを止め、タブを閉じる。
- 失敗したら、その Issue を `In progress` に戻すか、新しい Issue を起票して直す。確認の結果は PR / Issue に 1 行で残す。
- 重い確認 (全画面、実機、位置情報) は、人に頼むか、最後にまとめて 1 回だけ行う。

## 5.6 フェーズ完了時のセキュリティチェック
`.claude/todo/phaseN.md` の全タスクがマージされたら、次の Phase に進む前に、**別のサブエージェント**に確認させる (`security-review` skill も使える)。観点:
- **秘密情報**: `git ls-files` と履歴に `.env`、`sb_secret_`、`service_role`、`ANTHROPIC_API_KEY` が無いか。`VITE_` に secret を入れていないか。
- **DB**: 全テーブルで RLS が有効か。クライアントが書き換えてはいけない列 (コイン、スコア、状態) を拒否できているか。ローカル Supabase で攻撃的な操作を試す。
- **API**: 全ルートで認証 (JWT 検証) があるか。他人の `user_id` を指定できないか。入力は zod で検証しているか。CORS は必要な Origin だけか。エラーに内部情報が出ていないか。
- **フロント**: secret を持っていないか。ユーザー入力の描画で XSS (`dangerouslySetInnerHTML` など) がないか。
- **依存**: `pnpm audit` で high 以上の脆弱性がないか。新しく入れたライブラリは、定番で保守されているか。
- 結果は 重大度 (高/中/低) 別に Issue にする。**高は直るまで次の Phase に進まない。** 結果は `docs/` ではなく Issue に残し、`progress.md` のブロッカーに書く。

## 6. 次の波へ
波が終わったら `origin/dev` を取り込み、2 に戻って次の波を決める。Ready の Issue がなくなったら、要件 (`docs/specs/`) と Phase の todo (`.claude/todo/`) から、足りない作業を起票して続ける。

## 7. 止まる条件 (人に聞く)
- 鍵・認可・個人情報に関わる変更、コストが発生する選択、DB・フレームワーク・アーキテクチャを変える大きな決断。
- 自動マージなどの操作が、権限の確認で拒否されたとき。**同じ操作を言い換えて繰り返さず**、何をしたかったかと理由を伝え、許可の方法を聞く。
- 要件どうしが矛盾し、どちらを取るかで画面や DB が大きく変わるとき。
