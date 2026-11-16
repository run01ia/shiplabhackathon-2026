import { Character } from './Character'

type Props = { accessories?: readonly string[] }

/** 下タブの上に座る相棒。操作 (tap()) のたびに肉球で「ぺち」と叩く。タップは下の画面に通す */
export function CatCompanion({ accessories }: Props) {
  return (
    <div
      className="pointer-events-none absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+68px)] z-4"
      aria-hidden="true"
    >
      <Character accessories={accessories} size={62} reactToTap />
    </div>
  )
}
