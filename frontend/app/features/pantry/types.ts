import type { fetchPantry, matchPantry } from './api'

// 型は API (backend の AppType) から得る
export type PantryItem = Awaited<ReturnType<typeof fetchPantry>>['items'][number]
export type PantryMatch = Awaited<ReturnType<typeof matchPantry>>['matches'][number]
