import type { Mood } from '../types'
import { Character } from './Character'

/** 旧名 (モック由来)。items.key (hat / ribbon / crown / glasses) もそのまま渡せる */
export type Accessory = 'cap' | 'bow' | 'crown' | 'glass'
type Props = {
  mood?: Mood
  accessories?: readonly string[]
  size?: number
  bob?: boolean
}

/** 互換用。既定のキャラ (猫) を描く <Character> の薄い包み */
export function Pet({ mood, accessories, size = 200, bob }: Props) {
  return <Character mood={mood} accessories={accessories} size={size} bob={bob} />
}
