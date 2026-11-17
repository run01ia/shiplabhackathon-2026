/** 画像の上限 (5MB)。Claude API の画像の上限でもある */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((b, i) => bytes[offset + i] === b)

/**
 * 先頭のバイト (マジックナンバー) から画像の形式を決める。対応外は null。
 * クライアントが送る Content-Type は信用しない
 */
export const detectImageType = (bytes: Uint8Array): ImageMediaType | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  // RIFF....WEBP
  const riff = startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
  if (riff && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  return null
}

export type ImageCheck =
  | { ok: true; mediaType: ImageMediaType }
  | { ok: false; reason: 'too_large' | 'bad_image' }

/** サイズ (ちょうど上限は可) と形式を確かめる */
export const checkImage = (bytes: Uint8Array): ImageCheck => {
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, reason: 'too_large' }
  const mediaType = detectImageType(bytes)
  return mediaType ? { ok: true, mediaType } : { ok: false, reason: 'bad_image' }
}
