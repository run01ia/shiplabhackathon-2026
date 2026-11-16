# Phase 1: 土台

ゴール: 開発を始められる状態にし、画面と仕様の形を決める。
優先度: A=絶対 / B=できれば / C=時間があれば
GitHub: [Project](https://github.com/users/run01ia/projects/1) / Milestone「Phase 1: 土台」。Issue 番号は各項目の `#N`。

- [ ] **環境構築** #2 (ルノリア) `A`
  - [ ] front: React + TypeScript 初期化
  - [ ] back: Hono + Cloudflare Workers 初期化
  - [ ] デプロイ設定 (Vercel / Cloudflare)
  - [ ] `wrangler deploy` で Hello World を workers.dev に出し、Supabase に接続できることを確認
- [ ] **DB セットアップ** #3 (NKMAK) `A`
  - [x] Supabase に決定 (認証も Supabase Auth)
  - [ ] プロジェクト作成・接続情報の共有方法を決める
  - [ ] back から接続できることを確認
- [ ] **画面モック作成** #4 (NKMAK) `A`
  - [ ] 主要画面のワイヤーフレーム (ログイン / リスト / ペット)
  - [ ] 画面遷移図
- [ ] **ブランチ運用・PR テンプレート整備** #5 (NKMAK) `B`
- [ ] **位置情報の技術確認** #6 (ゆうと) `A`
  - [ ] 「アプリ起動時に Geolocation で現在地を取り、登録スーパーの近くなら買い物中画面へ遷移」が実現できるか確認 (iOS Safari の許可の挙動、精度)
  - [ ] スーパー登録方法 (現在地を保存) の確認
- [ ] **DB テーブル設計** #7 (NKMAK) `A`
  - [ ] users / lists / list_items
  - [ ] currency (残高) と point_logs (ポイント履歴)
  - [ ] items / user_items (着せ替え)
- [ ] **スコア・ポイントの仕様確定** #8 (ゲーム担当) `A`
  - [ ] プラス要素とマイナス要素の点数表
  - [ ] 買い物上手スコアの計算式
- [ ] **MVP のデモシナリオ決定** #9 `B`
