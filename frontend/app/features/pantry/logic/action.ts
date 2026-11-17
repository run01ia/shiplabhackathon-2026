/** リスト画面の clientAction に送る intent (在庫の操作) */
export const PANTRY_INTENT = {
  add: 'pantry-add',
  status: 'pantry-status',
  remove: 'pantry-remove',
} as const

export type PantryCommand =
  | { type: 'add'; name: string }
  | { type: 'status'; id: string; status: 'have' | 'low' }
  | { type: 'remove'; id: string }

/** フォームを在庫の操作として読む。在庫の intent でない・中身が不正なら null */
export const parsePantryCommand = (form: FormData): PantryCommand | null => {
  const id = String(form.get('pantryId') ?? '')
  switch (form.get('intent')) {
    case PANTRY_INTENT.add: {
      const name = String(form.get('name') ?? '').trim()
      return name ? { type: 'add', name } : null
    }
    case PANTRY_INTENT.status:
      return id
        ? { type: 'status', id, status: form.get('status') === 'low' ? 'low' : 'have' }
        : null
    case PANTRY_INTENT.remove:
      return id ? { type: 'remove', id } : null
    default:
      return null
  }
}
