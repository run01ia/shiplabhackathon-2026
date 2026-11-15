---
name: impl-plan
description: docs/specs/ の要件をもとに、概要設計・詳細設計・タスク・オーケストレーションを docs/impl-plan/ に作成して実装する。
---

# impl-plan

`new-spec` で定義した要件を、実装可能な計画へ落とし込むスキル。手作業でフォルダ・ファイルを作らず、必ず `templates/` を使う。

## ディレクトリ構造

```
docs/impl-plan/{created-date}-{summary-en}/
  index.md
  summary.md              # 概要設計
  detailed-design.md      # REQ-IDごとの詳細設計
  task/
    index.md
    {NN}-{task-summary-en}.md
  orchestration.md        # タスク定義の後に作成
  discussion/
    index.md
    {topic-slug}.md
```

実装計画フォルダは対応する `docs/specs/{spec-folder}/` と 1:1 にする。すべての設計とタスクは対象 REQ-ID にリンクする。各 `index.md` は同階層の成果物へのリンクを保つ。

## 手順

### A. 概要設計

1. 対象の仕様フォルダを確認する。存在しなければ、先に `new-spec` を実行する。
2. `docs/impl-plan/{date}-{slug}/`、`task/`、`discussion/` を作る。`index.md`、`summary.md`、`detailed-design.md`、task/discussion の index をテンプレートから作成し、`docs/impl-plan/index.md` を更新する。この段階で `orchestration.md` は作成しない。
3. `summary.md` に、概要、技術選定・アーキテクチャ、フォルダ構成、処理フロー、動作確認（正常系）を記載する。対象要件、前提条件、画面操作または API 呼び出し、期待結果を含める。
4. 技術選定に複数案がある場合は、候補とトレードオフを `discussion/` に記録し、AI が判断して決定する。人間の合意は待たず、そのまま詳細設計へ進む。

### B. 詳細設計とタスク定義

1. `detailed-design.md` に、各 REQ-ID の責務、インターフェース・データ、処理・状態遷移、例外・境界条件、動作確認（正常系）を記載する。
2. 詳細設計を根拠に、`task/{NN}-{task-slug}.md` を作る。各タスクには対象要件、対象詳細設計、データフロー、正常系の動作確認、完了の定義を記載する。`task/index.md` も更新する。
3. すべてのタスクを定義してから `orchestration.md` を作る。依存関係、並列可否、担当、進捗、完了時の動作確認を記載する。タスク定義より先に作成してはならない。

### C. 実装（並列）

速度優先で、依存のないタスクは**並列**に進める。

- `orchestration.md` に、タスクを「波 (Wave)」に分けて書く。同じ波のタスクは互いに独立で、同時に実装できる。
- 先に共通の土台 (DB テーブル、API の型、共有の型定義) を第 1 波で作る。後続の波はこれを前提にする。
- 並列タスクごとに git worktree (`../okaimonojyouzu-wt/{branch-name}`) とサブエージェントを用意し、1 メッセージで同時に起動する。ブランチは `feat/{task-slug}`。
- **親エージェントは、実装を始める前と、タスクの状態が変わるたびに `.claude/todo/progress.md` を読み、更新する。** 同じタスクの二重着手を避ける。
- 並列タスクが同じファイルを触らないよう、タスクの担当ファイル・ディレクトリを `orchestration.md` に明記する。front と back の分割が基本。
- front と back をつなぐ API の契約 (パス、リクエスト、レスポンスの型) は第 1 波で決めて固定する。
- 1 タスク = 1 PR (`pr` skill、ベースは `main`)。波の終わりにオーケストレーターがマージ順と衝突を確認する。

1. `orchestration.md` の波の順に、各タスクを実装する。**テストコードは書かない。** 委任した場合は、実際の変更と動作確認の結果をオーケストレーターが確認する。
2. タスクの進捗は `未着手` / `実装中` / `完了` で管理する。承認待ちのステータスは使わない。
3. タスク完了時は画面または API から正常系の動作を確認し、1タスク単位でコミットする。実装中の設計変更・トレードオフは discussion に記録し、該当タスクと相互リンクする。
4. 全タスク完了後、`orchestration.md` の完了時の動作確認を実施し、進捗を更新する。

## 人間の確認点

設計中は人間の合意を待たない。詳細設計とタスク定義が終わった時点で、`design-flow` の「設計完了レポート」(アーティファクト) で結果を共有し、そのまま実装へ進む。前提が変わった場合は、該当する設計を更新して下流を直す。
