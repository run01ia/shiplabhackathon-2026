import { Form, redirect, useLoaderData } from 'react-router'
import { Button } from '~/components/Button'
import { Coin } from '~/components/Coin'
import { ProgressBar } from '~/components/ProgressBar'
import { Screen, ScreenTitle } from '~/components/Screen'
import { signOut } from '~/features/auth'
import { fetchMe, Pet } from '~/features/pet'
import { requireAccessToken } from '~/lib/session'

// /me はブラウザから認証付きで呼ぶ (トークンは localStorage にあるため)
export async function clientLoader() {
  return fetchMe(await requireAccessToken())
}

export function HydrateFallback() {
  return <Screen />
}

export async function clientAction() {
  await signOut()
  return redirect('/login')
}

export default function Home() {
  const me = useLoaderData<typeof clientLoader>()
  return (
    <Screen>
      <div className="mb-3 flex items-center gap-3">
        <b className="text-xl">Lv.{me.level}</b>
        <div className="flex-1">
          <ProgressBar value={me.exp % 100} color="var(--color-sun)" />
        </div>
        <Coin amount={me.coins} />
      </div>
      <ScreenTitle>{me.petName}</ScreenTitle>
      <Pet accessories={['cap']} size={230} bob />
      <Form method="post" className="mt-auto">
        <Button type="submit" variant="sub" small>
          ログアウト
        </Button>
      </Form>
    </Screen>
  )
}
