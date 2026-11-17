import { animate, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/Button'
import { Coin } from '~/components/Coin'
import { Screen } from '~/components/Screen'
import { Toast } from '~/components/Toast'
import { BIG_EVERY } from '../animations'
import type { LoginReward, Me, ShopItem, ShopResult } from '../api'
import { CHARACTERS, DEFAULT_CHARACTER, unlockedBetween } from '../characters'
import { useCatTap } from '../hooks/useCatTap'
import { useDoze } from '../hooks/useDoze'
import { useLevelUp } from '../hooks/useLevelUp'
import { useShopActions } from '../hooks/useShopActions'
import type { Mood } from '../types'
import { Character } from './Character'
import { HeartPop } from './HeartPop'
import { LevelBadge } from './LevelBadge'
import { LevelUpFx, LevelUpRays } from './LevelUpFx'
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

/** なでたときのひとこと (順番に出す)。BIG_EVERY 回目は大喜び */
const PET_LINES = ['えへへ', 'もっとなでて', 'ごろごろ…', 'くすぐったい！']
const DOZE_MS = 20_000

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
  // なでた回数。変わるたびに猫が跳ね、ハートが出る
  const [pets, setPets] = useState(0)

  const coins = me.coins - pendingCoins
  // レベルアップは、報酬のコインが届き終わってから祝う。それまでは上がる前のレベルと見た目を出す
  const levelUp = useLevelUp({
    level: me.level,
    hint: reward?.levelUp ?? null,
    wait: rewards.length > 0,
    onStart: ({ to }) => {
      setBubble(`Lv.${to} になったよ！`)
      // 大技 (宙返り) で喜ぶ
      setPets((n) => n + BIG_EVERY - (n % BIG_EVERY))
      feel('joy', 2600)
    },
  })
  const total = reward?.granted ? reward.total : 0
  // ゲージ: 上がる直前は、コインが届くたびに満ちていく (上がる前の量は分からないので、割合で見せる)
  const filling = levelUp.pending && pendingCoins > 0 && total > 0
  const gauge = filling
    ? { value: 0.3 + 0.7 * (1 - pendingCoins / total), max: 1 }
    : { value: Math.max(0, me.growth.levelExp - pendingCoins), max: me.growth.nextLevelExp }
  // しばらく触らないと居眠りする。なでる・ボタンを押すと起きる
  const asleep = useDoze(DOZE_MS)
  const shownMood: Mood = mood === 'happy' && asleep ? 'sleep' : mood

  const pet = () => {
    tap()
    const n = pets + 1
    const big = n % BIG_EVERY === 0
    setPets(n)
    setBubble(asleep ? 'ふにゃ…おはよ！' : big ? 'だいすき！' : PET_LINES[n % PET_LINES.length])
    feel('joy', big ? 1400 : 900)
  }

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
          <LevelBadge
            level={levelUp.shown}
            value={gauge.value}
            max={gauge.max}
            rising={filling ? 'filling' : levelUp.pending ? 'full' : null}
          />
          <div ref={coinRef}>
            <Coin amount={coins} />
          </div>
        </div>
        <PetRoom bubble={shownMood === 'sleep' ? 'すやすや…' : bubble}>
          {levelUp.celebration ? <LevelUpRays /> : null}
          <button
            type="button"
            className="relative mx-auto block cursor-pointer border-0 bg-transparent p-0"
            aria-label={`${me.petName}をなでる`}
            onClick={pet}
          >
            <motion.div
              key={`${me.equippedItems.join(',')}-${levelUp.shown}`}
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 480, damping: 12 }}
            >
              <Character
                accessories={me.equippedItems}
                mood={shownMood}
                size={220}
                pulse={pets}
                level={levelUp.shown}
                shadow
                reactToTap
              />
            </motion.div>
            <HeartPop count={pets} />
          </button>
          <div className="relative text-center">
            <span className="inline-block rounded-pill border-2 border-ink bg-paper px-3 text-sm">
              {me.petName}
            </span>
          </div>
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
        level={levelUp.shown}
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
            // コインが届くたびに、猫が「ぺち」と数える
            tap()
          }}
          onDone={() => {
            setRewards([])
            setPendingCoins(0)
            if (levelUp.pending) return
            setBubble('おかえり！ えらい！')
            // 全部届いたら大技 (宙返り) で喜ぶ。レベルアップが続くときは、そちらで喜ぶ
            setPets((n) => n + BIG_EVERY - (n % BIG_EVERY))
            feel('joy')
          }}
        />
      ) : null}
      {levelUp.celebration ? (
        <LevelUpFx
          levelUp={levelUp.celebration}
          perks={unlockedBetween(
            CHARACTERS[DEFAULT_CHARACTER],
            levelUp.celebration.from,
            levelUp.celebration.to,
          ).map((g) => g.name)}
          onDone={() => {
            levelUp.finish()
            setBubble('もっと そだててね')
          }}
        />
      ) : null}
    </>
  )
}
