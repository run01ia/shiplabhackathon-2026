import Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { classifyApiError } from './claude'

// API は呼ばない。SDK の例外の型だけで分けられることを確かめる
const apiError = (status: number) =>
  Anthropic.APIError.generate(status, undefined, 'error', new Headers())

describe('classifyApiError', () => {
  it('429 と 5xx は API 側の都合 (回数に数えない)', () => {
    expect(classifyApiError(apiError(429))).toBe('rate_limited')
    expect(classifyApiError(apiError(500))).toBe('server_error')
    expect(classifyApiError(apiError(529))).toBe('server_error')
  })

  it('400 系は rejected、タイムアウトと接続エラーは unreachable (回数に数える)', () => {
    expect(classifyApiError(apiError(400))).toBe('rejected')
    expect(classifyApiError(apiError(401))).toBe('rejected')
    expect(classifyApiError(new Anthropic.APIConnectionTimeoutError())).toBe('unreachable')
    expect(classifyApiError(new Anthropic.APIConnectionError({ message: 'x' }))).toBe('unreachable')
  })

  it('SDK の例外でなければ null', () => {
    expect(classifyApiError(new Error('x'))).toBeNull()
  })
})
