# ローカルの環境構築

自分の PC で、frontend (画面) と backend (API) を動かし、ログインできるまでの手順です。
やり方は 2 つあります。

| やり方 | Docker | キー | 向いている人 |
|---|---|---|---|
| **A. 開発用のクラウド DB を使う** (下の「Docker なしで始める」) | 要らない | 管理者からもらう | まず動かしたい人 |
| B. ローカルの Supabase を使う (1 章から) | 要る | 要らない (自分の PC で完結) | DB の変更 (マイグレーション) をする人 |

> クラウドへのデプロイ (Cloudflare Workers、Vercel) の手順は準備中です (Issue #2)。

## Docker なしで始める (開発用のクラウド DB)

みんなで 1 つの開発用 Supabase を共有します。**本番とは別のプロジェクト**で、本物のユーザーのデータは入っていません。

1. Node.js と pnpm を入れる (下の 1 章。Docker と Supabase CLI は要りません)。
2. ソースを取得して `pnpm install` (2 章)。
3. `cp frontend/.env.example frontend/.env` と `cp backend/.env.example backend/.env`。
4. 管理者から **DM で** 値をもらい、貼る。
   - `frontend/.env`: `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY` (公開してよい値)
   - `backend/.env`: `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`
5. `pnpm dev` で起動し、http://localhost:5173 で「新規登録」する。

**secret key の扱い** (DB を何でも読み書きできる鍵です):

- `backend/.env` 以外に書かない。Discord のチャンネル、Issue、PR、コミット、スクリーンショットに出さない。
- frontend (`VITE_` で始まる変数) に入れない。画面から誰でも読めてしまいます。
- 漏れたかもと思ったら、すぐ管理者に伝える (Supabase の画面で鍵を作り直します)。

注意: DB は全員で共有なので、自分のアカウント以外のデータは消さないでください。`supabase db reset` は使いません (ローカル用)。

## 1. 前提ツール

| ツール | 用途 | 確認コマンド |
|---|---|---|
| Node.js 22.12 以上 (24 で動作確認済み) | frontend と backend を動かす | `node -v` |
| pnpm 10 (`packageManager` は `pnpm@10.33.0`) | パッケージ管理 | `pnpm -v` |
| Git | ソースの取得、ブランチ | `git --version` |
| Docker (Docker Desktop など) | ローカルの Supabase を動かす (`supabase start` が使う) | `docker info` |
| Supabase CLI | ローカルの Supabase の起動・停止、マイグレーション | `supabase --version` |
| エディタ (VS Code など) + Biome 拡張 | コードを書く。保存時に整形できる | - |

- Node.js のバージョンは、リポジトリでは指定していません (`engines` や `.nvmrc` はありません)。上の値は、使っているツールの要件 (Vite 8: `^20.19.0 || >=22.12.0`、Vitest 5: `^22.12.0 || ^24.0.0 || >=26.0.0`) からの目安です。
- pnpm は `corepack enable` で、`package.json` の `packageManager` に書かれた版が使えます。
- Supabase CLI の入れ方: https://supabase.com/docs/guides/local-development/cli/getting-started (macOS なら `brew install supabase/tap/supabase`)。
- VS Code の Biome 拡張: 拡張機能で「Biome」(`biomejs.biome`) を探して入れます。

## 2. ソースを取得して、パッケージを入れる

```bash
git clone https://github.com/run01ia/shiplabhackathon-2026.git
cd shiplabhackathon-2026
pnpm install   # リポジトリのルートで 1 回。frontend と backend の両方に入る
```

## 3. ローカルの Supabase を起動する

Docker を起動してから、リポジトリのルートで実行します。

```bash
supabase start    # 初回はイメージのダウンロードで数分かかる
supabase status   # URL とキーを表示する
```

`supabase start` は `supabase/migrations/` の SQL を流し、テーブルを作ります。
主なポート (`supabase/config.toml`):

| もの | URL |
|---|---|
| API (Supabase の URL) | `http://127.0.0.1:54321` |
| DB (Postgres) | `127.0.0.1:54322` |
| Studio (ブラウザで DB を見る画面) | `http://127.0.0.1:54323` |
| メールの確認用 (Inbucket) | `http://127.0.0.1:54324` |

止めるときは `supabase stop` です。

## 4. `.env` を作る

ひな形 (`.env.example`) をコピーして、値を入れます。

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

`supabase status` に出る値を貼ります (CLI の版によって、`Publishable key` / `Secret key` または `anon key` / `service_role key` と表示されます)。

**`frontend/.env`** (公開してよい値だけ):

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<Publishable key (anon key)>
VITE_API_URL=http://localhost:3000
```

**`backend/.env`**:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<Publishable key (anon key)>
SUPABASE_SECRET_KEY=<Secret key (service_role key)>
ANTHROPIC_API_KEY=        # レシートの AI 判定を使うときだけ。空なら機能ごと隠れる
RECEIPT_DAILY_GLOBAL_LIMIT=   # 全ユーザー合計の 1 日の読み取り上限。空なら 200
RECEIPT_READER=           # memory にすると Claude API を呼ばず固定の結果を返す (NODE_ENV=development のときだけ)
CORS_ORIGINS=             # 画面の URL の許可リスト (カンマ区切り)。空なら http://localhost:5173
```

> **注意**
> - `.env` はコミットしません (`.gitignore` で除外済み)。`git add` はファイルを指定して行い、`.env` を含めないでください。
> - secret / service_role キーは、DB を何でも操作できる鍵です。**`backend/.env` だけに置き、frontend には置きません。**
> - `VITE_` で始まる変数は、ブラウザに公開されます。秘密の値を入れないでください。

## 5. 起動する

ルートの `package.json` の scripts:

| コマンド (ルートで実行) | 内容 |
|---|---|
| `pnpm dev` | frontend と backend を同時に起動 |
| `pnpm dev:frontend` | frontend だけ (`react-router dev`) → http://localhost:5173 |
| `pnpm dev:backend` | backend だけ (`tsx watch src/index.ts`) → http://localhost:3000 |

### backend をローカルの Supabase につなぐ

今の `dev` スクリプトは、**`backend/.env` を自動では読みません** (`backend/src/index.ts` は `process.env` だけを見ます)。
`SUPABASE_URL` と `SUPABASE_SECRET_KEY` がないと、backend はメモリ実装 (DB なし) で起動し、ログに次の 1 行が出ます。

```
SUPABASE_* 未設定のため memory 実装で起動します
```

Supabase につなぐときは、`.env` をシェルに読み込んでから起動します。

```bash
cd backend
set -a; . ./.env; set +a   # .env の値を環境変数にする (このターミナルだけ)
pnpm dev
```

frontend の `frontend/.env` は Vite が自動で読みます。

### DB なしで backend だけ動かす

API の形だけを試すなら、Supabase なしで動きます (`backend/src/deps.ts` の `createMemoryDeps`)。

```bash
pnpm dev:backend
curl http://localhost:3000/health                                     # {"ok":true}
curl -H 'Authorization: Bearer test-u1' http://localhost:3000/me      # test-<好きなID> がそのままユーザーになる
```

- データはメモリにだけあり、止めると消えます。
- 着せ替えアイテムのマスタは、メモリ実装にも入っています。
- この状態では、画面からのログイン (本物の Supabase のトークン) は通りません。

## 6. ログインできるか確認する

1. Supabase、backend (Supabase につないだ状態)、frontend を起動する。
2. ブラウザで http://localhost:5173 を開く。ログインしていないので `/login` に移ります。
3. メールアドレスとパスワードを入れて、**新規登録** のボタンを押す。
   - ローカルでは、メールの確認は不要です (`supabase/config.toml` の `[auth.email] enable_confirmations = false`)。登録するとそのままログインします。
   - 登録すると、DB のトリガーが `profiles` の行を自動で作ります。
4. `/home` にペットが表示されれば成功です。

テスト用のユーザーは、この画面から登録するのがいちばん簡単です。Studio (http://127.0.0.1:54323) の Authentication からも作れます。
`supabase db reset` をすると、`supabase/seed.sql` のデモ用ユーザーが入ります。**メール `demo@example.test` / パスワード `demo-pass-1234`** (ローカル専用のテスト値) でログインすると、過去 2 回の買い物のポイントがある状態から始まります。ログイン報酬は未受け取りなので、ホームで報酬の演出が出ます。

確認コマンド (任意):

```bash
pnpm --filter frontend typecheck   # 型チェック
pnpm --filter backend test         # domain のテスト (Vitest)
pnpm check                          # Biome (整形と検査)
```

## 7. ブランチと PR の流れ

作業は必ず GitHub の Issue から始めます。

```bash
git fetch origin
git checkout -b feat/<やること> origin/dev    # dev から切る。fix/ chore/ docs/ も同じ
# ... 作業 ...
pnpm exec biome check --write <触ったパス>    # コミット前に整形と検査。エラーは直す
git add <触ったファイル>                       # git add -A / git add . は使わない
git commit
git push -u origin feat/<やること>
gh pr create --base dev                        # PR は dev 向け
```

- ブランチは `feat/* → dev → main` の順に進みます。画面 (Vercel) は `dev` (プレビュー) と `main` (本番) に、API (Workers) は `main` だけにデプロイされます (staging はありません)。
- PR の本文には `Closes #<Issue番号>` を入れます。`dev` へのマージでは Issue は自動で閉じないので、マージ後に閉じます。
- コミットメッセージは `feat: ...` `fix: ...` `docs: ...` のような英語の接頭辞 + 日本語です (`.claude/skills/commit/`)。

## 8. つまずきやすい点

| 症状 | 原因と対処 |
|---|---|
| `EADDRINUSE: address already in use :::3000` | ポート 3000 を別のプロセス (別のターミナルの backend など) が使っている。`lsof -i :3000` で探して止める。5173 や 54321〜54324 も同じ |
| `supabase start` が失敗する | Docker が起動していない。Docker Desktop を起動し、`docker info` が通るか確かめる |
| `pnpm install` や起動で Node のエラーが出る | Node.js が古い。`node -v` で 22.12 以上か確かめる |
| ログに `SUPABASE_* 未設定のため memory 実装で起動します` と出て、ログインしても `401` | backend が `.env` を読んでいない。[5. の手順](#backend-をローカルの-supabase-につなぐ) で環境変数を読み込んでから起動する |
| 画面から API を呼ぶと CORS エラー | backend が許しているのは、既定では `http://localhost:5173` だけ (`backend/src/app.ts`。変えるときは `CORS_ORIGINS`)。`127.0.0.1:5173` ではなく `localhost:5173` で開く |
| 位置情報が取れない | ブラウザの位置情報は HTTPS か `localhost` でしか使えない。スマホから PC の IP アドレス (`http://192.168...`) で開くと使えない。許可を拒否した場合も取れない |
| スマホの見た目を確認したい | PC のブラウザの開発者ツールで、幅 390px (iPhone 14/15 相当) にする |
