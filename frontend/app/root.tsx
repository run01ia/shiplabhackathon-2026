import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import type { Route } from './+types/root'
import { supabase } from './lib/supabase'
import './styles/app.css'

export const meta: Route.MetaFunction = () => [{ title: '買いネコ' }]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const Frame = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-[600px]:flex min-[600px]:justify-center min-[600px]:p-6">
    <div className="relative h-dvh w-full overflow-hidden bg-cream min-[600px]:h-[844px] min-[600px]:w-[390px] min-[600px]:rounded-[38px] min-[600px]:border-3 min-[600px]:border-ink min-[600px]:shadow-pop-lg">
      {children}
    </div>
  </div>
)

export default function App() {
  return (
    <Frame>
      <Outlet />
    </Frame>
  )
}

// SPA モードでは HydrateFallback は root だけに置ける。初回の clientLoader 待ちの間に出る
export function HydrateFallback() {
  return <Frame />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const details = import.meta.env.DEV && error instanceof Error ? error.message : null
  // 古いログイン情報が原因のことが多いので、ログインし直せるようにする
  const relogin = async () => {
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[390px] flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <h1 className="text-xl">
        {notFound ? 'ページが見つかりません' : 'うまく表示できませんでした'}
      </h1>
      <p className="text-sm text-muted">
        {notFound ? 'URL をたしかめてください。' : 'もう一度ログインすると直ることがあります。'}
      </p>
      {details ? <p className="text-xs text-muted">{details}</p> : null}
      <button
        type="button"
        className="min-h-11 rounded-btn border-3 border-ink bg-sun px-5 text-base"
        onClick={relogin}
      >
        ログインし直す
      </button>
    </main>
  )
}
