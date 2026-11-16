import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { findAccessory } from '../accessories'

type Props = {
  itemKey: string
  name: string
  /** 名前の下の補足 (あと何コイン、など) */
  note?: ReactNode
  /** コイン不足などで押せない見た目にする (押すと理由を出すため、disabled にはしない) */
  dimmed?: boolean
  label: ReactNode
  variant: 'sub' | 'sun' | 'mint'
  onPress: () => void
}

/** 棚の 1 マス (ショップ・きがえ共通)。押すと少し沈む */
export function ShopItemCard({ itemKey, name, note, dimmed, label, variant, onPress }: Props) {
  const accessory = findAccessory(itemKey)
  return (
    <motion.div whileTap={{ scale: 0.96 }}>
      <Card className="mb-0! p-2.5! text-center">
        <div className="grid h-16 place-items-center">
          {accessory ? (
            <svg viewBox={accessory.iconViewBox} className="h-12 w-16" aria-hidden="true">
              {accessory.art}
            </svg>
          ) : (
            <span className="text-[34px]">?</span>
          )}
        </div>
        <div>{name}</div>
        <div className="h-4 text-xs font-normal text-muted">{note}</div>
        <Button
          small
          variant={variant}
          className={`mt-1.5 mb-0! ${dimmed ? 'opacity-55' : ''}`}
          onClick={onPress}
        >
          {label}
        </Button>
      </Card>
    </motion.div>
  )
}
