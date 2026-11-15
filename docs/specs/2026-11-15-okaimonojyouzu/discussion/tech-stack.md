# 技術選定

作成日: 2026-11-15
ステータス: 検討中

## 論点

DB に Supabase と Firebase のどちらを使うか。他は方針が決まっている。

## 選択肢（任意）

- Supabase
- Firebase

## 決定

- 言語: TypeScript
- フロント: React (ライブラリは各自判断)
- バック: Hono (ライブラリは各自判断)
- インフラ: バックエンドは Cloudflare、フロントは Vercel。選定基準は工数とコスト。
- DB: **未決。** NKMAK が比較して決める (Phase 1)。決まったらこのトピックを更新し、`CLAUDE.md` の記述も直す。
- 開発運用: 機能ごとにブランチを作り PR を出す。
