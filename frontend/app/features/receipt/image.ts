// 送る前にブラウザで画像を小さくする (スマホの写真は 5MB を超えやすい。通信量と AI の料金も減る)
const MAX_EDGE = 2000
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))

/** 長い辺を 2000px までに縮めた JPEG にする。縮められないときは、元の画像が条件に合えばそのまま返す */
export const shrinkImage = async (file: File): Promise<File> => {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await toJpeg(canvas)
    if (blob && blob.size <= MAX_BYTES) return new File([blob], 'receipt.jpg', { type: blob.type })
  } catch {
    // 読めない形式 (HEIC など) は下で判定する
  }
  if (ACCEPTED.includes(file.type) && file.size <= MAX_BYTES) return file
  throw new Error('この画像は読めなかったよ。カメラでとりなおしてみてね')
}
