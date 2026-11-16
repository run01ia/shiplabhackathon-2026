import { Outlet } from "react-router";
import { TabBar } from "~/components/TabBar";
import { requireAccessToken, requireLoginMark } from "~/lib/session";
import type { Route } from "./+types/tab-layout";

// 未ログインなら /login へ。SSR は目印 cookie、ブラウザは Supabase のセッションで判定する
export function loader({ request }: Route.LoaderArgs) {
  requireLoginMark(request);
  return null;
}

export async function clientLoader() {
  await requireAccessToken();
  return null;
}

export default function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}
