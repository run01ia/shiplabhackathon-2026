---
name: new-spec
description: docs/specs/ 配下に要件ごとの仕様フォルダ、またはその中の discussion トピックを、決められたテンプレートに沿って作成する。「新しい仕様(要件)フォルダを作って」「specsに追加して」「discussionにトピックを追加して」「意思決定記録を作って」といった依頼で使う。
---

# new-spec

`docs/specs/` 配下のドキュメント構造を統一フォーマットで強制的に作成するスキル。手作業でフォルダ・ファイルを作らず、必ずこのスキルのテンプレートを使うこと。

## ディレクトリ構造のルール

```
docs/specs/
  index.md                              # 要件フォルダの一覧(パス+簡易説明)
  {created-date}-{summary-en}/          # 要件ごとのフォルダ。例: 2026-08-15-token-usage-monitoring
    index.md                            # このフォルダ内のファイル/フォルダ一覧(パス+簡易説明)
    spec-requirements.md                # 仕様要件
    tech-requirements.md                # 技術要件
    discussion/
      index.md                          # トピック一覧(パス+簡易説明)。必須
      {topic-slug}.md                   # トピックごとの意思決定記録
```

- フォルダ名・ファイル名はすべて英語（kebab-case推奨）。
- 要件フォルダ名は `{YYYY-MM-DD}-{summary-en}` 形式（作成日時-概要）。
- 本文の言語は日本語でよい。ファイル名/フォルダ名のみ英語。
- `index.md` は必ずその同階層にあるフォルダ・ファイルへのリンクと一言説明を持つ表を含める。新しいファイルを追加したら対応する `index.md` も更新する。
- `spec-requirements.md` と `tech-requirements.md` には目次を付ける。各要件は `### REQ-XXX: タイトル` の見出しで区切り、REQ-ID を両ファイルで1:1対応させる（spec側のREQ-001はtech側のREQ-001に対応する技術要件）。目次には各REQ-IDへのアンカーリンクを載せ、要件数が増えてもAIが目次から該当REQ-IDのセクションだけを読めば内容を把握できるようにする。要件を追加・削除したら両ファイルの目次と見出しを必ず同期させる。
- `tech-requirements.md` は要件定義の範囲で扱う技術的制約・既存システムとの統合条件・非機能要件を記録する。具体的な使用技術の選定、アーキテクチャ、実装方法は `impl-plan` の概要設計で決める。
- 要件（spec-requirements.md・tech-requirements.md のREQ-IDセクション）は discussion での意思決定をもとに生まれる想定。各REQ-IDセクションには「関連discussion」として `discussion/{topic-slug}.md` へのリンクを必ず入れる。discussion トピックがまだ無い段階で要件を書く場合は、先に手順Bで discussion トピックを作成してからリンクを埋める（プレースホルダーのまま放置しない）。

## 手順

### A. 新しい要件フォルダを作成する場合

1. 依頼内容から概要を読み取り、英語の kebab-case スラッグ（例: `token-usage-monitoring`）を決める。日付は今日の日付（YYYY-MM-DD）。
2. `docs/specs/{date}-{slug}/` と `docs/specs/{date}-{slug}/discussion/` を作成する。
3. このスキルの `templates/` 配下のファイルをコピーし、プレースホルダーを置換して配置する。
   - `templates/index.md` → `docs/specs/{date}-{slug}/index.md`
   - `templates/spec-requirements.md` → `docs/specs/{date}-{slug}/spec-requirements.md`
   - `templates/tech-requirements.md` → `docs/specs/{date}-{slug}/tech-requirements.md`
   - `templates/discussion-index.md` → `docs/specs/{date}-{slug}/discussion/index.md`
   - プレースホルダー `{{TITLE}}` は要件のタイトル（日本語可）、`{{DATE}}` は作成日で置換する。
4. `docs/specs/index.md` の一覧表に、新しいフォルダへのパスと簡易説明の行を追記する。
5. 中身（背景・要件・技術要件など）はプレースホルダーのままにせず、依頼内容・既存資料から埋める。不明な点は質問で止まらず、妥当な既定値を採用して discussion に「前提・仮決め」として記録する。REQ-IDセクションを追加する要件がdiscussionでの議論から生まれた場合は、先に手順Bでdiscussionトピックを作成し、そのパスをREQ-IDセクションの「関連discussion」に必ずリンクする。
6. 人間の合意を待たずに `impl-plan` へ進む。要件の要約、REQ-ID、受け入れ条件、仮決めした事項は、設計完了時にまとめて提示する（`design-flow` 参照）。

### B. 既存の要件フォルダに discussion トピックを追加する場合

1. 対象の要件フォルダ（`docs/specs/{date}-{slug}/`）を確認する。存在しなければ先に A を行う。
2. トピックの英語スラッグ（kebab-case）を決める。
3. `templates/discussion-topic.md` をコピーし、`docs/specs/{date}-{slug}/discussion/{topic-slug}.md` に配置。`{{TOPIC_TITLE}}` `{{DATE}}` を置換する。「選択肢」セクションは任意で、比較検討した選択肢が無ければセクションごと削除してよい。
4. `docs/specs/{date}-{slug}/discussion/index.md` のトピック一覧に、新しいファイルへのパス・簡易説明・ステータス（`検討中`/`決定`/`却下`。discussion-topic.mdの「ステータス」欄と一致させる）を追記する。トピックのステータスが変わったら index.md 側も更新する。

## 注意

- テンプレートの構成（見出し・ファイル名・index.md の必須化）を勝手に変えない。変更したい場合は理由を記録したうえで `templates/` 自体を更新する。
- index.md の更新を忘れない（要件フォルダの index.md、discussion の index.md、`docs/specs/index.md` の3箇所は追加のたびに更新対象になり得る）。
- 要件を変更した場合は、影響する discussion と下流の設計・タスクを更新する。
