import type { CharacterDefinition } from '../types'
import { cat } from './cat'

/** キャラの一覧。新しいキャラはここに 1 行足す */
export const CHARACTERS = { cat } satisfies Record<string, CharacterDefinition>
export type CharacterKey = keyof typeof CHARACTERS
export const DEFAULT_CHARACTER: CharacterKey = 'cat'
