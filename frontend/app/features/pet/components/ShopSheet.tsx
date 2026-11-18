import { motion } from 'motion/react'
import { BottomSheet } from '~/components/BottomSheet'
import { Coin } from '~/components/Coin'
import type { ShopItem } from '../api'
import type { Mood } from '../types'
import { Character } from './Character'
import { PetRoom } from './PetRoom'
import { ShopItemCard } from './ShopItemCard'

export type SheetTab = 'shop' | 'dress'
type Props = {
  tab: SheetTab | null
  onTab: (tab: SheetTab) => void
  onClose: () => void
  coins: number
  items: readonly ShopItem[]
  equipped: readonly string[]
  mood: Mood
  /** ペットのレベル (育った見た目で試着する) */
  level?: number
  onBuy: (item: ShopItem) => void
  onEquip: (item: ShopItem) => void
}

const TABS: { key: SheetTab; label: string }[] = [
  { key: 'shop', label: 'ショップ' },
  { key: 'dress', label: 'きがえ' },
]

/** ショップ / きがえのボトムシート。上にペットを置き、買う・着るがその場で見える */
export function ShopSheet({
  tab,
  onTab,
  onClose,
  coins,
  items,
  equipped,
  mood,
  level,
  onBuy,
  onEquip,
}: Props) {
  // おみやげ限定 (rarity あり) は買えないので、ショップの棚には出さない。持っていれば、きがえに出る
  const shown = items.filter((i) => (tab === 'dress' ? i.owned : i.rarity === null))
  return (
    <BottomSheet open={tab !== null} onClose={onClose}>
      <motion.div
        className="max-h-[76dvh] overflow-y-auto px-1 pb-1.5"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        <div className="mb-3 flex items-center">
          <Coin amount={coins} />
        </div>
        <div className="mb-3.5 flex overflow-hidden rounded-[14px] border-3 border-ink bg-white">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`min-h-11 flex-1 cursor-pointer border-0 ${tab === t.key ? 'bg-sun' : 'bg-transparent'}`}
              aria-pressed={tab === t.key}
              onClick={() => onTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <PetRoom compact>
          <Character
            accessories={equipped}
            mood={mood}
            level={level}
            size={128}
            shadow
            reactToTap
          />
        </PetRoom>
        <div className="grid grid-cols-2 gap-3">
          {shown.map((item) =>
            tab === 'dress' ? (
              <ShopItemCard
                key={item.key}
                itemKey={item.key}
                name={item.name}
                variant={item.equipped ? 'mint' : 'sub'}
                label={item.equipped ? 'きている' : 'きる'}
                onPress={() => onEquip(item)}
              />
            ) : (
              <ShopItemCard
                key={item.key}
                itemKey={item.key}
                name={item.name}
                variant={item.owned ? 'sub' : 'sun'}
                dimmed={!item.owned && coins < item.price}
                note={
                  !item.owned && coins < item.price ? `あと ${item.price - coins} コイン` : null
                }
                label={item.owned ? '持っている' : `● ${item.price}`}
                onPress={() => onBuy(item)}
              />
            ),
          )}
        </div>
        {tab === 'dress' && shown.length === 0 ? (
          <p className="py-6 text-center text-sm font-normal text-muted">
            まだ何も持っていないよ。ショップで買ってみよう
          </p>
        ) : null}
      </motion.div>
    </BottomSheet>
  )
}
