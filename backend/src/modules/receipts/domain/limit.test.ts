import { describe, expect, it } from 'vitest'
import { checkImage, detectImageType, MAX_IMAGE_BYTES } from './image'
import {
  checkReserve,
  DAILY_GLOBAL_SCAN_LIMIT,
  DAILY_SCAN_LIMIT,
  parseGlobalLimit,
  remainingScans,
  shouldRelease,
} from './limit'

describe('remainingScans', () => {
  it('上限の 1 つ手前まではまだ読める', () => {
    expect(remainingScans(0)).toBe(DAILY_SCAN_LIMIT)
    expect(remainingScans(DAILY_SCAN_LIMIT - 1)).toBe(1)
  })

  it('上限ちょうどと、それを超えたときは 0', () => {
    expect(remainingScans(DAILY_SCAN_LIMIT)).toBe(0)
    expect(remainingScans(DAILY_SCAN_LIMIT + 3)).toBe(0)
  })
})

describe('checkReserve (全体の上限)', () => {
  it('全体の上限の 1 つ手前までは確保でき、ちょうどで止まる', () => {
    expect(checkReserve(0, 199, 5, 200)).toBeNull()
    expect(checkReserve(0, 200, 5, 200)).toBe('global_limit')
  })

  it('自分の上限を先に伝える', () => {
    expect(checkReserve(5, 200, 5, 200)).toBe('limit')
  })

  it('環境変数が未設定・不正なら既定値 (上限なしにはならない)', () => {
    expect(parseGlobalLimit('50')).toBe(50)
    expect(parseGlobalLimit(undefined)).toBe(DAILY_GLOBAL_SCAN_LIMIT)
    expect(parseGlobalLimit('-1')).toBe(DAILY_GLOBAL_SCAN_LIMIT)
    expect(parseGlobalLimit('Infinity')).toBe(DAILY_GLOBAL_SCAN_LIMIT)
  })
})

describe('shouldRelease', () => {
  it('429 と 5xx だけ、確保した 1 回を取り消す', () => {
    expect(shouldRelease('rate_limited')).toBe(true)
    expect(shouldRelease('server_error')).toBe(true)
  })

  it('400 系・タイムアウト・壊れた応答は回数に数える', () => {
    expect(shouldRelease('rejected')).toBe(false)
    expect(shouldRelease('unreachable')).toBe(false)
    expect(shouldRelease('refused')).toBe(false)
    expect(shouldRelease('invalid_output')).toBe(false)
  })
})

const jpeg = (size: number) => {
  const bytes = new Uint8Array(size)
  bytes.set([0xff, 0xd8, 0xff, 0xe0])
  return bytes
}

describe('checkImage', () => {
  it('先頭のバイトで形式を決める (JPEG / PNG / WebP)', () => {
    expect(detectImageType(jpeg(16))).toBe('image/jpeg')
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(detectImageType(png)).toBe('image/png')
    expect(detectImageType(new TextEncoder().encode('RIFF0000WEBPVP8 '))).toBe('image/webp')
  })

  it('画像でないもの (HTML、空) は拒否する', () => {
    const html = new TextEncoder().encode('<html>')
    expect(checkImage(html)).toEqual({ ok: false, reason: 'bad_image' })
    expect(checkImage(new Uint8Array(0))).toEqual({ ok: false, reason: 'bad_image' })
  })

  it('ちょうど 5MB は通し、1 バイトでも超えたら拒否する', () => {
    expect(checkImage(jpeg(MAX_IMAGE_BYTES)).ok).toBe(true)
    expect(checkImage(jpeg(MAX_IMAGE_BYTES + 1))).toEqual({ ok: false, reason: 'too_large' })
  })
})
