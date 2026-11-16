import { createApi } from "~/lib/api";

/** GET /me (ペット名・コインなど)。型は backend の AppType から得る */
export const fetchMe = async (accessToken: string) => {
  const res = await createApi(accessToken).me.$get();
  if (!res.ok) throw new Response("failed to load /me", { status: res.status });
  return res.json();
};
