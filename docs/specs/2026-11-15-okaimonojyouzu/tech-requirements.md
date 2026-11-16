# 技術要件: お買い物上手

対象仕様: [spec-requirements.md](./spec-requirements.md)

## 目次

- [共通の技術前提](#共通の技術前提)
- [技術要件](#技術要件)
  - [REQ-001: ユーザー認証](#req-001-ユーザー認証)
  - [REQ-002: 買い物リスト作成](#req-002-買い物リスト作成)
  - [REQ-003: 予算設定](#req-003-予算設定)
  - [REQ-004: リスト外購入の妥当性判断](#req-004-リスト外購入の妥当性判断)
  - [REQ-005: 買い物結果の入力と判定](#req-005-買い物結果の入力と判定)
  - [REQ-006: ポイントとゲーム内通貨](#req-006-ポイントとゲーム内通貨)
  - [REQ-007: ペット育成画面](#req-007-ペット育成画面)
  - [REQ-008: 着せ替え](#req-008-着せ替え)
  - [REQ-009: スーパー付近で買い物画面へ自動遷移](#req-009-スーパー付近で買い物画面へ自動遷移)
  - [REQ-010: コンビニ入店アラート](#req-010-コンビニ入店アラート)
  - [REQ-011: コスパ悪商品の抑制リマインド](#req-011-コスパ悪商品の抑制リマインド)
  - [REQ-012: レシートAI判定](#req-012-レシートAI判定)
  - [REQ-013: 家の在庫管理](#req-013-家の在庫管理)
  - [REQ-014: 履歴と手動修正](#req-014-履歴と手動修正)

## 共通の技術前提

- 言語: TypeScript / フロント: React / バック: Hono (Cloudflare Workers) / フロントのデプロイ: Vercel
- DB: Supabase (決定。[discussion/tech-stack.md](./discussion/tech-stack.md))
- 期限は来週の水曜日まで。デモ動画まで用意する。テストコードは書かず、画面または API で正常系を確認する。
- 画面: スマホ (縦持ち) 前提。基準サイズは幅 390px × 高さ 844px。PWA として動かす。詳細は [CLAUDE.md](../../../CLAUDE.md) の「画面・デザインの前提」を参照。
- 具体的な技術選定・アーキテクチャは `impl-plan` の概要設計で決める。

## 技術要件

### REQ-001: ユーザー認証

対象要件: [spec-requirements.md#req-001](./spec-requirements.md#req-001-ユーザー認証)

関連discussion: [discussion/tech-stack.md](./discussion/tech-stack.md)

技術的制約・統合条件: 認証は Supabase Auth を使う。API は認証済みユーザーのみ許可する。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-002: 買い物リスト作成

対象要件: [spec-requirements.md#req-002](./spec-requirements.md#req-002-買い物リスト作成)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: リスト CRUD API (Hono)。リストと品目のテーブルを持つ。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-003: 予算設定

対象要件: [spec-requirements.md#req-003](./spec-requirements.md#req-003-予算設定)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: 予算はリストの属性として保存する。金額は整数 (円) で扱う。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-004: リスト外購入の妥当性判断

対象要件: [spec-requirements.md#req-004](./spec-requirements.md#req-004-リスト外購入の妥当性判断)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: 品目に「リスト外」「不要購入」のフラグを持たせる。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-005: 買い物結果の入力と判定

対象要件: [spec-requirements.md#req-005](./spec-requirements.md#req-005-買い物結果の入力と判定)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: 判定ロジックは back で実行し、結果をポイント付与 API に渡す。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-006: ポイントとゲーム内通貨

対象要件: [spec-requirements.md#req-006](./spec-requirements.md#req-006-ポイントとゲーム内通貨)

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

技術的制約・統合条件: 通貨の増減は専用 API に集約し、増減のたびに `point_logs` (user_id、増減、理由、日時) へ 1 行追加する。残高は `profiles.coins`。点数表と計算式は Phase 1 で確定する。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-007: ペット育成画面

対象要件: [spec-requirements.md#req-007](./spec-requirements.md#req-007-ペット育成画面)

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

技術的制約・統合条件: 画面は React。アニメーションは軽量なものにする (CSS または軽量ライブラリ)。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-008: 着せ替え

対象要件: [spec-requirements.md#req-008](./spec-requirements.md#req-008-着せ替え)

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

技術的制約・統合条件: アイテムのマスタ (items) と所持 (user_items) のテーブルを持つ。購入 API は通貨減算と所持追加を一括で行う。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-009: スーパー付近で買い物画面へ自動遷移

対象要件: [spec-requirements.md#req-009](./spec-requirements.md#req-009-スーパー付近で買い物画面へ自動遷移)

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

技術的制約・統合条件: ブラウザの Geolocation API をアプリ起動時に 1 回呼ぶ (HTTPS と位置情報の許可が必要)。距離判定は front で行い、現在地はサーバへ送らない。登録店舗の緯度経度だけを DB に保存する。バックグラウンド検知はしない。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-010: コンビニ入店アラート

対象要件: [spec-requirements.md#req-010](./spec-requirements.md#req-010-コンビニ入店アラート)

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

技術的制約・統合条件: 自動検知はしない。手動ボタンにする場合も位置情報は使わない。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-011: コスパ悪商品の抑制リマインド

対象要件: [spec-requirements.md#req-011](./spec-requirements.md#req-011-コスパ悪商品の抑制リマインド)

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

技術的制約・統合条件: 通知基盤 (通知許可の取得とスケジュール) が前提。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-012: レシートAI判定

対象要件: [spec-requirements.md#req-012](./spec-requirements.md#req-012-レシートAI判定)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: Claude API の画像入力 (推奨モデル: Haiku 5.5、`claude-haiku-5-5`) を、Hono (Workers) から呼ぶ。OCR と分類を 1 回の呼び出しで行い、品目・金額・分類を構造化 JSON で返させる。API キーは Workers のシークレットに置き、front へは出さない。レシート画像は保存せず、判定後に破棄する。実装時は `claude-api` skill を使う。時間があれば実施する (C)。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-013: 家の在庫管理

対象要件: [spec-requirements.md#req-013](./spec-requirements.md#req-013-家の在庫管理)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: 時間があれば実施する。在庫テーブルを追加する。

非機能要件: 期限が短いため、拡張性より動くことを優先する。

### REQ-014: 履歴と手動修正

対象要件: [spec-requirements.md#req-014](./spec-requirements.md#req-014-履歴と手動修正)

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

技術的制約・統合条件: ポイント履歴は `point_logs` テーブル (クライアントは select のみ、追加は API)。買い物履歴は、完了した `lists` と `list_items` をそのまま使う。購入金額の修正は `list_items.price` と `is_unnecessary` の更新 (RLS で本人の行のみ許可、完了後も可)。`list_items.price` は null 可 (購入時に入れるため)。

非機能要件: 履歴は新しい順に最大 50 件を返す。

