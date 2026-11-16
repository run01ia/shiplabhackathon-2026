# 開発ガイド

「お買い物上手」の開発に参加する人が、最初に読むページです。
全体のつながりと、どこを触ればよいかがわかるようにまとめています。

## 読む順番

1. [setup.md](./setup.md): 自分の PC でアプリを動かすまでの手順
2. [architecture.md](./architecture.md): 全体の図と、フォルダの役割
3. [tech-stack.md](./tech-stack.md): 使っている技術と、選んだ理由
4. [database.md](./database.md): テーブルの図 (ER 図) と、誰が何を読み書きできるか
5. [api.md](./api.md): API の一覧と、リクエスト・レスポンスの例

もっと詳しいルール (層の決まり、禁止 import、テスト方針) は [../architecture.md](../architecture.md) にあります。
「なぜそう決めたか」は [../decisions.md](../decisions.md) にあります。

## やりたいこと → 触るファイル (早見表)

| やりたいこと | 触るファイル |
|---|---|
| 画面を足す | `frontend/app/routes/<名前>.tsx` を作り、`frontend/app/routes.ts` に 1 行足す。中身は `frontend/app/features/<機能>/` に置く |
| 画面の部品を足す | 機能専用なら `frontend/app/features/<機能>/components/`。どこでも使うなら `frontend/app/components/` |
| 画面から API を呼ぶ | `frontend/app/features/<機能>/api.ts` に関数を足し、画面の `clientLoader` / `clientAction` から呼ぶ |
| API を足す | `backend/src/modules/<機能>/routes.ts` (パス)、`schemas.ts` (入力の検証)、`usecases/<操作>.ts` (処理) |
| 新しい機能のまとまり (モジュール) を足す | `backend/src/modules/<名前>/` を作る → `backend/src/deps.ts` → `backend/src/app.ts` に `.route('/', xxx(d))` → `biome.json` |
| DB の読み書きを足す | `backend/src/modules/<機能>/repository.ts` (interface) と `infra/supabase.ts`・`infra/memory.ts` (実装) |
| スコアや報酬の計算を変える | `backend/src/modules/lists/domain/score.ts` (買い物の配点)、`backend/src/modules/profile/domain/reward.ts` (ログイン報酬)。テストは隣の `*.test.ts` |
| テーブルや列を足す | `supabase/migrations/` に新しい SQL を足す ([database.md](./database.md#マイグレーションの追加方法)) |
| 着せ替えアイテムを足す | 新しい migration で `items` に行を足す + `frontend/app/features/pet/accessories.tsx` に同じ `key` で絵を足す |
| ペットのキャラを足す | `frontend/app/features/pet/characters/` ([features/pet/README.md](../../frontend/app/features/pet/README.md)) |
| 色・影・角丸を変える | `frontend/app/styles/app.css` の `@theme` |
