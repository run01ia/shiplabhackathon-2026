# 仕様要件: お買い物上手

技術要件: [tech-requirements.md](./tech-requirements.md)

## 目次

- [背景](#背景)
- [要件一覧](#要件一覧)
  - [REQ-001: ユーザー認証](#req-001-ユーザー認証)
  - [REQ-002: 買い物リスト作成](#req-002-買い物リスト作成)
  - [REQ-003: 予算設定](#req-003-予算設定)
  - [REQ-004: リスト外購入の妥当性判断](#req-004-リスト外購入の妥当性判断)
  - [REQ-005: 買い物結果の入力と判定](#req-005-買い物結果の入力と判定)
  - [REQ-006: ポイントとゲーム内通貨](#req-006-ポイントとゲーム内通貨)
  - [REQ-007: ペット育成画面](#req-007-ペット育成画面)
  - [REQ-008: 着せ替え](#req-008-着せ替え)
  - [REQ-009: スーパー入店アラート](#req-009-スーパー入店アラート)
  - [REQ-010: コンビニ入店アラート](#req-010-コンビニ入店アラート)
  - [REQ-011: コスパ悪商品の抑制リマインド](#req-011-コスパ悪商品の抑制リマインド)
  - [REQ-012: レシートOCRと分析](#req-012-レシートOCRと分析)
  - [REQ-013: 家の在庫管理](#req-013-家の在庫管理)

## 背景

実店舗特化の購入抑制アプリ。20 代の大学生・新社会人 (一人暮らし、自己管理が苦手だが支出管理の意識はある) が、買い物リストと予算を決め、守れたらプラス、破ったらマイナスとしてゲーム化して購入を抑制する。ペットを育て、着せ替えで拡張する。

- コンセプト・ペルソナ・スコープ: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)
- 優先度: A=絶対 (これがないと発表できない) / B=できれば / C=時間があれば
- スコープ外: 何を買ったかの記録

## 要件一覧

### REQ-001: ユーザー認証

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: A

ユーザーがサインアップ・ログイン・ログアウトできる。データはユーザーごとに分離する。

受け入れ条件:
- メールなどでサインアップできる
- ログイン後、自分のデータだけが見える
- ログアウトできる

### REQ-002: 買い物リスト作成

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: A

買い物前に品目のリストを作る。品目の追加・編集・削除と、購入済みチェックができる。

受け入れ条件:
- 品目を追加・編集・削除できる
- 買い物中に購入済みにチェックできる
- リストはユーザーごとに保存される

### REQ-003: 予算設定

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: B

今回の買い物で使える予算を設定する。品目の合計と予算の残額を表示する。

受け入れ条件:
- リストごとに予算を設定できる
- 品目の金額合計と残額が見える

### REQ-004: リスト外購入の妥当性判断

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: A

買い物中にリストにない品目を買いたくなったとき、追加して「本当に必要か」を確認する。買ったものは不要購入として記録できる。

受け入れ条件:
- リスト外の品目を追加できる
- 追加時に必要性を確認する画面が出る
- 不要と判断した購入を記録できる

### REQ-005: 買い物結果の入力と判定

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: A

買い物終了時に実際の支出額を入力し、予算内か、不要購入があったかを判定する。判定結果はポイントに反映する。

受け入れ条件:
- 支出額を入力できる
- 予算超過を判定できる
- 判定結果が REQ-006 のポイントに反映される

### REQ-006: ポイントとゲーム内通貨

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

優先度: A

プラス要素でポイントが貯まり、マイナス要素で減る。ポイントはゲーム内通貨として管理する。

受け入れ条件:
- ログインボーナスが 1 日 1 回付与される
- リスト作成・閲覧でポイントが付く
- 予算内達成と買い物に行かなかった日でポイントが付く
- 予算超過・不要購入・コンビニ立ち寄りで減る
- 増減の履歴を確認できる

### REQ-007: ペット育成画面

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

優先度: A

ペットを表示し、買い物の結果に応じて育つ。通貨とスコアを表示する。

受け入れ条件:
- ペットが表示される
- 通貨とスコアが見える
- ログインボーナスを受け取れる

### REQ-008: 着せ替え

関連discussion: [discussion/game-design.md](./discussion/game-design.md)

優先度: B

ゲーム内通貨で着せ替えアイテムを購入し、ペットに着せられる。

受け入れ条件:
- アイテム一覧を見られる
- 通貨が足りれば購入できる
- 購入済みアイテムを着せ替えられる

### REQ-009: スーパー入店アラート

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

優先度: B

よく行くスーパーを登録し、入店を検知したら「買い物リストは作りましたか？」と知らせる。

受け入れ条件:
- スーパーを登録できる
- 登録店の入店時にリスト作成を促す通知が出る

### REQ-010: コンビニ入店アラート

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

優先度: C

コンビニへの入店を検知したら「買う目的はありますか？」と警告する。立ち寄りはマイナス要素になる。

受け入れ条件:
- コンビニ入店時に警告が出る
- 立ち寄りがマイナスとして記録される

### REQ-011: コスパ悪商品の抑制リマインド

関連discussion: [discussion/location-alert.md](./discussion/location-alert.md)

優先度: C

ペットボトルなどコスパの悪い商品を買いにコンビニへ行くことを、リマインド通知で抑制する。

受け入れ条件:
- リマインド通知を受け取れる

### REQ-012: レシートOCRと分析

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: C

レシートを撮影して品目と金額を読み取り、買い物結果に反映する。手入力を省くのが狙い。

受け入れ条件:
- レシート画像から品目と金額を取得できる
- 取得結果を買い物結果に反映できる

### REQ-013: 家の在庫管理

関連discussion: [discussion/concept-and-scope.md](./discussion/concept-and-scope.md)

優先度: C

家にある食材を管理し、重複買いを防ぐ。

受け入れ条件:
- 在庫を登録・更新できる
- 買い物リスト作成時に在庫を参照できる

