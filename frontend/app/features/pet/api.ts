import { createApi, unwrap } from '~/lib/api'

/** GET /me (ペット名・コインなど)。型は backend の AppType から得る */
export const fetchMe = async (accessToken: string) => unwrap(await createApi(accessToken).me.$get())
