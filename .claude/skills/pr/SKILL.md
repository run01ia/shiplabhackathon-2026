---
name: pr
description: 機能ごとのブランチから PR を作成する。「PR 作って」「プルリク出して」といった依頼で使う。簡潔さを最優先にする。
---

# pr

現在のブランチから `gh pr create` で PR を作る。説明は**短く**。長い補足は書かない。

## ルール

- 1 PR = 1 機能。`main` へ直接 push しない。
- PR のベースは基本 `main` (`gh pr create --base main`)。聞き返さずにそのまま作ってよい。
- ブランチ名: `feat/xxx`, `fix/xxx`, `chore/xxx`, `docs/xxx`
- タイトル: `{type}: {概要}` (`commit` skill の type と同じ。日本語、70 字以内)
- 本文は次の 3 項目だけ。各 1〜3 行、箇条書き可。

```
## 何を
## なぜ
## 動作確認
```

- 動作確認は「画面で何をしたか」または「API を何で叩いたか」を 1 行で書く。テストコードは書かない方針。
- 関連 Issue があれば `Closes #N` を 1 行足す。
- スクショやログは、画面変更のときだけ。

## 手順

1. `git status` と `git log main..HEAD --oneline` で、PR に含まれる変更を確認する。
2. 未コミットがあれば先に `commit` skill でコミットする。
3. `git push -u origin <branch>` する。
4. `gh pr create` を実行する。
5. PR の URL を報告し、`.claude/todo/progress.md` の該当行を `PR中` に更新する。

## 注意

- push と PR 作成は外部に公開される操作。ユーザーが「PR 作って」と頼んだ場合のみ実行する。
- 送り先 (`origin`) が意図したリポジトリか、実行前に `git remote -v` で確認する。
- コミットメッセージと PR 本文の末尾の署名行は、システムの指示に従う。
