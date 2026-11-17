import { Form, redirect, useLoaderData } from 'react-router'
import { signOut } from '~/features/auth'
import { HomeScreen, loadHome, runShopAction } from '~/features/pet'
import { requireAccessToken } from '~/lib/session'
import type { Route } from './+types/home'

// /me などはブラウザから認証付きで呼ぶ (トークンは localStorage にあるため)。ログイン報酬もここで受け取る
export async function clientLoader() {
  return loadHome(await requireAccessToken())
}

// intent: logout | buy | equip
export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData()
  if (form.get('intent') === 'logout') {
    await signOut()
    return redirect('/login')
  }
  return runShopAction(await requireAccessToken(), form)
}

export default function Home() {
  const { me, items, reward } = useLoaderData<typeof clientLoader>()
  return (
    <HomeScreen
      me={me}
      items={items}
      reward={reward}
      footer={
        // めったに使わないので、画面の一番下に小さく置く
        <Form method="post" className="mt-auto text-center">
          <input type="hidden" name="intent" value="logout" />
          <button
            type="submit"
            className="min-h-11 cursor-pointer border-0 bg-transparent px-3 text-xs text-muted underline"
          >
            ログアウト
          </button>
        </Form>
      }
    />
  )
}
