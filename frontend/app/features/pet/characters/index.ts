import type { CharacterDefinition, GrowthPart } from '../types'
import { cat } from './cat'

/** キャラの一覧。新しいキャラはここに 1 行足す */
export const CHARACTERS = { cat } satisfies Record<string, CharacterDefinition>
export type CharacterKey = keyof typeof CHARACTERS
export const DEFAULT_CHARACTER: CharacterKey = 'cat'

/** from より上、to 以下のレベルで増える見た目 (レベルアップの演出で名前を出す) */
export const unlockedBetween = (
  definition: CharacterDefinition,
  from: number,
  to: number,
): readonly GrowthPart[] => definition.growth?.filter((g) => g.level > from && g.level <= to) ?? []
