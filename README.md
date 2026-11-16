# shiplabhackathon-2026

## 開発環境での実行

frontend / backend 共に実行する場合：
```bash
pnpm dev
```

個別に実行する場合：
```bash
# Frontend (React Router v7 / Vite)
pnpm dev:frontend

# Backend (Hono / Cloudflare Workers)
pnpm dev:backend
```

---

## CI/CD & デプロイ仕様

本リポジトリでは GitHub Actions を利用して CI/CD パイプラインを構成しています。

- **Frontend (`/frontend`)**: [Vercel](https://vercel.com/) にデプロイ
- **Backend (`/backend`)**: [Cloudflare Workers](https://workers.cloudflare.com/) にデプロイ

### 動作トリガー
- **Pull Request 作成・更新時**: CI（型チェックおよびビルド検証）のみ実行
- **`dev` ブランチへのマージ時**: 自動デプロイを実行（Frontend は Vercel、Backend は Cloudflare Workers）

---

## 設定すべき環境変数・シークレット一覧

### 1. GitHub Actions Secrets（デプロイ用・必須）

GitHub リポジトリの **Settings > Secrets and variables > Actions > New repository secret** に登録してください。

| Secret 名 | 用途 | 取得元・確認場所 |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Vercel CLI 認証用トークン | Vercel 右上アイコン > **Account Settings** > **Tokens** > **Create** |
| `VERCEL_ORG_ID` | Vercel の Team ID（または User ID） | Vercel の Team/Account **Settings** > **General** 内の `Team ID` (`team_...`) |
| `VERCEL_PROJECT_ID` | Frontend プロジェクトの ID | Vercel のプロジェクト > **Settings** > **General** 内の `Project ID` (`prj_...`) |
| `CLOUDFLARE_API_TOKEN` | Workers デプロイ用 API トークン | Cloudflare 右上アイコン > **マイ プロフィール** > **API トークン** > **トークンを作成** > 「Cloudflare Workers を編集」テンプレート |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | Cloudflare ダッシュボード右側（または Workers & Pages 画面）の **アカウント ID** |

> **Vercel プロジェクト作成時の注意点**:  
> Vercel でリポジトリをインポートする際、**Root Directory** を `frontend` に指定してください。

### 2. Frontend（Vercel）環境変数

フロントエンドからバックエンド API を呼び出すための環境変数です。  
Vercel プロジェクトの **Settings > Environment Variables** に設定します。

| 変数名 | 説明 | 設定例 |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | バックエンド API のエンドポイント URL | `https://shiplabhackathon-backend.<あなたのサブドメイン>.workers.dev` |

### 3. Backend（Cloudflare Workers）環境変数・シークレット

DB 接続文字列や外部 API キー等の秘匿情報は、Cloudflare ダッシュボードの Worker > **Settings > Variables and Secrets > Add Secret**（または `wrangler secret put <KEY_NAME>`）から暗号化登録します。

| 変数名（例） | 説明 | 設定例 |
| :--- | :--- | :--- |
| `DATABASE_URL` | データベース接続文字列 | `postgresql://...` |
| `JWT_SECRET` | 認証用トークンシークレット | 任意のランダム文字列 |
| `OPENAI_API_KEY` | 外部サービス API キー | `sk-...` |

### 4. ローカル開発用環境変数ファイル

手元の開発環境で動作させるためのファイルです（Git にはコミットされません）。

- **`frontend/.env.local`**:
  ```env
  VITE_API_BASE_URL=http://localhost:8787
  ```
- **`backend/.dev.vars`** (Wrangler ローカル起動時のシークレット):
  ```env
  # ローカル用シークレット
  ```
