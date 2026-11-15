# 技術選定

作成日: 2026-11-15
ステータス: 決定

## 論点

DB に何を使うか。他は方針が決まっている。

## 選択肢（任意）

- Supabase (採用)
- Firebase
- Cloudflare D1

## 決定

- 言語: TypeScript
- フロント: React (ライブラリは各自判断)
- バック: Hono (ライブラリは各自判断)
- インフラ: バックエンドは Cloudflare、フロントは Vercel。選定基準は工数とコスト。
- DB: **Supabase** に決定。認証 (REQ-001) も Supabase Auth を使う。理由: 認証が標準で付き、期限 1 週間で自前実装の工数を省ける。Cloudflare の D1 も検討したが、認証を自前で作る必要があるため見送った。
- 注意: Supabase の Free プランは放置すると一時停止する。発表の直前に必ずアクセスして動作確認する。
- Workers からは `supabase-js` (HTTP) で接続する。
- 開発運用: 機能ごとにブランチを作り PR を出す。
