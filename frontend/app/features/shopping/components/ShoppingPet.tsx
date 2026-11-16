import { Pet } from '~/features/pet'

type Props = { mood: 'happy' | 'sad'; size: number }

/**
 * 買い物の画面で使うペットの表示はここだけにまとめる。
 * Pet が Character に作り替わったら、このファイルだけ直す。
 */
export function ShoppingPet({ mood, size }: Props) {
  return <Pet mood={mood} size={size} accessories={['cap']} />
}
