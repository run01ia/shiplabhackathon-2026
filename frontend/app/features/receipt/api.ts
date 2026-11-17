import { createApi, unwrap } from '~/lib/api'

/** GET /receipts/status。キー未設定なら enabled: false (ボタンを出さない) */
export const fetchReceiptStatus = async (accessToken: string) =>
  unwrap(await createApi(accessToken).receipts.status.$get())

/** POST /receipts/scan (multipart)。画像は保存されず、読み取り結果だけが返る */
export const scanReceipt = async (accessToken: string, listId: string, image: File) =>
  unwrap(await createApi(accessToken).receipts.scan.$post({ form: { image, listId } }))
