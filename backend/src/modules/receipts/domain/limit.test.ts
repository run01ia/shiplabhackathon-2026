import { describe, expect, it } from 'vitest'
import { checkImage, detectImageType, MAX_IMAGE_BYTES } from './image'
import { DAILY_SCAN_LIMIT, remainingScans } from './limit'

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
