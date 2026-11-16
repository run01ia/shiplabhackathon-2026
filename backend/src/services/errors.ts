// service が投げるエラー。HTTP への変換は middleware/error.ts が行う (service は hono を知らない)
export type AppErrorKind = 'not_found' | 'conflict' | 'bad_request'

export class AppError extends Error {
  constructor(
    public kind: AppErrorKind,
    message: string,
  ) {
    super(message)
  }
}
