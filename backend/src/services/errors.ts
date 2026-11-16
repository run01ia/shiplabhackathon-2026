// service が投げるエラー。HTTP への変換は middleware/error.ts で行う (service は hono を import しない)
export type ServiceErrorKind = 'not_found' | 'bad_request'

export class ServiceError extends Error {
  constructor(
    readonly kind: ServiceErrorKind,
    message: string,
  ) {
    super(message)
  }
}
