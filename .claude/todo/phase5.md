# Phase 5: 仕上げ

※ 最後に Issue 化する。

- [ ] **発表準備**
  - [x] デモシナリオの確定 (たたき台: docs/demo/scenario.md。チームで最終確認)
  - [ ] デモ動画の撮影・編集 (構成: docs/demo/presentation.md。Playwright で録画 + Remotion で字幕と演出)
  - [ ] 発表資料の作成・発表者の決定 (3 分、動画中心: docs/demo/presentation.md)
- [ ] **追加機能** `C` (時間があれば)
  - [x] レシート AI 判定 `C` (REQ-012。撮影 → Claude API で読み取りと分類 → スコアとペットのコメントに反映)
  - [x] 家の食材の在庫管理 `C`
- [ ] **猫以外のキャラの追加** `C` (犬など。`game-design.md` の「猫以外のキャラへの拡張」の設計に、定義を 1 つ足す。DB に profiles のキャラのキーと items の slot を追加)
