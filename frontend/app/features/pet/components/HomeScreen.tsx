import { animate, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/Button'
import { Coin } from '~/components/Coin'
import { ProgressBar } from '~/components/ProgressBar'
import { Screen } from '~/components/Screen'
import { Toast } from '~/components/Toast'
import type { LoginReward, Me, ShopItem, ShopResult } from '../api'
import { useCatTap } from '../hooks/useCatTap'
import { useShopActions } from '../hooks/useShopActions'
import type { Mood } from '../types'
import { Character } from './Character'
import { PetRoom } from './PetRoom'
import { RewardFx } from './RewardFx'
import { type SheetTab, ShopSheet } from './ShopSheet'

type Props = {
  me: Me
  items: readonly ShopItem[]
  /** ログイン報酬の結果 (このセッションで問い合わせ済みなら null) */
  reward: LoginReward | null
  /** 画面の一番下に置くもの (ログアウトなど) */
  footer?: ReactNode
}

// 紙吹雪は使うときにだけ読み込む (最初の表示を重くしない)
const confetti = async (y: number) => {
  const { default: fire } = await import('canvas-confetti')
  fire({
    particleCount: 70,
    spread: 75,
    startVelocity: 32,
    origin: { y },
    colors: ['#ffc93c', '#f2542d', '#3dbe8b', '#ffb3a7'],
    disableForReducedMotion: true,
  })
}

/** ホーム: レベル・コイン、ペット、ログイン報酬の演出、ショップ / きがえ */
export function HomeScreen({ me, items, reward, footer }: Props) {
  const { tap } = useCatTap()
  const navigate = useNavigate()
  const coinRef = useRef<HTMLDivElement>(null)
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 報酬は最初の 1 回ぶんだけ覚える (loader の読み直しで消えないように)
  const [rewards, setRewards] = useState(() => (reward?.granted ? reward.rewards : []))
  // まだコイン表示に届いていない枚数。演出が進むと 0 になる
  const [pendingCoins, setPendingCoins] = useState(() => (reward?.granted ? reward.total : 0))
  const [sheet, setSheet] = useState<SheetTab | null>(null)
  const [bubble, setBubble] = useState('今日もよろしくね')
  const [toast, setToast] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('happy')

  const coins = me.coins - pendingCoins

  useEffect(() => {
    if (rewards.length > 0) confetti(0.45)
    return () => clearTimeout(moodTimer.current)
  }, [rewards.length])

  const feel = (next: Mood, ms = 1400) => {
    clearTimeout(moodTimer.current)
    setMood(next)
    moodTimer.current = setTimeout(() => setMood('happy'), ms)
  }

  const pulseCoin = () => {
    if (coinRef.current) animate(coinRef.current, { scale: [1.15, 1] }, { duration: 0.15 })
  }

  const shop = useShopActions(me.equippedItems, (r: ShopResult) => {
    if (!r.ok) {
      feel('sad')
      setToast(r.intent === 'buy' ? 'コインがたりない…' : 'うまくいかなかった…')
      return
    }
    if (r.intent === 'buy') {
      setToast('ゲット！')
      confetti(0.7)
      pulseCoin()
    }
    if (r.equipped) {
      feel('joy')
      setBubble('にあう？')
    }
  })

  const buy = (item: ShopItem) => {
    tap()
    if (item.owned || shop.busy) return
    if (coins < item.price) {
      feel('sad')
      setToast('コインがたりない…')
      return
    }
    shop.buy(item)
  }

  const toggle = (item: ShopItem) => {
    tap()
    if (!shop.busy) shop.toggle(item)
  }

  const open = (tab: SheetTab) => {
    tap()
    setSheet(tab)
  }

  return (
    <>
      <Screen>
        <div className="mb-3 flex items-center gap-3">
          <div>
            <div className="text-xs font-normal text-muted">買い物上手</div>
            <b className="text-xl">Lv.{me.level}</b>
          </div>
          <div className="flex-1">
            <ProgressBar value={me.exp % 100} color="var(--color-sun)" />
          </div>
          <div ref={coinRef}>
            <Coin amount={coins} />
          </div>
        </div>
        <PetRoom bubble={bubble}>
          <button
            type="button"
            className="mx-auto block cursor-pointer border-0 bg-transparent p-0"
            aria-label={`${me.petName}をなでる`}
            onClick={() => {
              tap()
              feel('joy', 900)
            }}
          >
            <motion.div
              key={me.equippedItems.join(',')}
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 480, damping: 12 }}
            >
              <Character accessories={me.equippedItems} mood={mood} size={220} bob reactToTap />
            </motion.div>
          </button>
          <div className="text-center text-sm">{me.petName}</div>
        </PetRoom>
        <div className="mb-3 flex gap-2.5">
          <Button
            variant="sub"
            className="mb-0! min-h-13 flex-1 text-base"
            onClick={() => open('shop')}
          >
            ショップ
          </Button>
          <Button
            variant="sub"
            className="mb-0! min-h-13 flex-1 text-base"
            onClick={() => open('dress')}
          >
            きがえ
          </Button>
        </div>
        <Button
          onClick={() => {
            tap()
            navigate('/lists')
          }}
        >
          買い物リストを作る
        </Button>
        {footer}
      </Screen>
      <ShopSheet
        tab={sheet}
        onTab={open}
        onClose={() => setSheet(null)}
        coins={coins}
        items={items}
        equipped={me.equippedItems}
        mood={mood}
        onBuy={buy}
        onEquip={toggle}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
      {rewards.length > 0 ? (
        <RewardFx
          rewards={rewards}
          targetRef={coinRef}
          onCoin={(amount) => {
            setPendingCoins((p) => Math.max(0, p - amount))
            pulseCoin()
          }}
          onDone={() => {
            setRewards([])
            setPendingCoins(0)
            setBubble('おかえり！ えらい！')
            feel('joy')
          }}
        />
      ) : null}
    </>
  )
}
