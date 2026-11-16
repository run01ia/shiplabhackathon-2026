import { Pet } from '~/features/pet'

type Props = {
  mood: 'happy' | 'sad' | 'joy'
  size: number
  /** もらった帽子の key。いつもの帽子の代わりにかぶる */
  hat?: string
}

/**
 * 買い物の画面で使うペットの表示はここだけにまとめる。
 * Pet が Character に作り替わったら、このファイルだけ直す。
 */
export function ShoppingPet({ mood, size, hat }: Props) {
  return <Pet mood={mood} size={size} accessories={[hat ?? 'cap']} />
}
