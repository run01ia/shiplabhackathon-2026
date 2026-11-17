# features/pet

ホーム (ペット、ログイン報酬の演出、ショップ / きがえ) と、下タブの上に座る相棒 (ボンゴキャット風)。
外から使うのは `index.ts` だけ。

## 相棒に「ぺち」と叩かせる (`tap()`)

タブのある画面 (`tab-layout.tsx` の配下) なら、どこからでも呼べる。操作のハンドラの中で 1 回呼ぶだけ。

```tsx
import { useCatTap } from '~/features/pet'

const { tap } = useCatTap()
<Button onClick={() => { tap(); addItem() }}>追加</Button>
```

- 左右の手は自動で交互になる。`tap` の参照は変わらず、呼んでも画面は再レンダリングされない (state を通さない)。
- Provider の外 (`/login`、`/shopping`) で呼んでも何も起きない (エラーにならない)。
- 呼び出し済み: 品目の追加 (`AddItemForm`)、購入・リスト外の購入・買い物の終了 (`routes/shopping.tsx`)、履歴の保存 (`useFixItem`)。

## 構成

| ファイル                   | 役割                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `types.ts`                 | `CharacterDefinition` (パーツ、支点、slot、補正)、`AccessoryDefinition`                  |
| `characters/`              | キャラの定義 (絵と座標だけ)。`cat.tsx` が最初の 1 体                                     |
| `accessories.tsx`          | アクセサリーの絵と slot (頭 `head`・顔 `face`・首 `neck`)。同じ slot は 1 つだけ         |
| `animations.ts`            | 動きをパーツ名で指定 (まばたき = `eyes`、しっぽ = `tail`、ぺち = `pawLeft` / `pawRight`) |
| `components/Character.tsx` | 定義を受け取って描く共通コンポーネント。`Pet` は互換用の包み                             |

動かすのは transform と opacity だけ。`prefers-reduced-motion` では、まばたき・しっぽ・呼吸・紙吹雪・コインの飛行を止め、ぺちは小さくする。

## 動きの決まり

- **待機 (CSS)**: まばたき (二度まばたきあり)・しっぽ・呼吸・耳のぴくっ・首かしげ。周期を割り切れない秒数にして、同じ並びに見せない。
- **反応 (Motion、`hooks/useCharacterMotion.ts`)**: `mood` と `pulse` で決まる。state を通さず MotionValue で動かす。
  - ぺち: 手が上がって叩き、体が一瞬つぶれて戻る。
  - `joy`: 溜め → 跳ねる → 着地。`pulse` (なでた回数) で、跳ねる / 首をふる / 5 回ごとに宙返り、と変わる。
  - `sad`: 頭が沈み、耳としっぽが垂れる。`sleep`: 目を閉じ、深い呼吸と「z」。起きるときに小さく跳ねる。
- **居眠り (`hooks/useDoze.ts`)**: `tap()` がしばらくないと眠る (ホーム 20 秒、常駐の猫 30 秒)。次の `tap()` で起きる。
- 常駐の猫は、続けて 4 回叩くと喜ぶ (コンボ)。報酬のコインが届くたびに `tap()` し、最後に宙返りする。
- 部屋 (`PetRoom`) の空は、開いた時刻で朝・昼・夕方・夜に変わる。
- キャラの定義に `earLeft` / `earRight` (任意) を足すと、耳が動く。なくても描ける。

## 育つ (レベルと見た目)

- レベルと経験値は backend が決める (`me.growth` の `levelExp / nextLevelExp` がゲージ)。画面は式を持たない。
- **レベルアップの演出** (`hooks/useLevelUp.ts`、`components/LevelUpFx.tsx`、`LevelBadge.tsx`): ホームで「最後に見せたレベル」(localStorage の `pet:seenLevel`) より上がっていたら祝う。報酬のコインが届き終わってから、Lv の数字が跳ね、後光と帯と紙吹雪が出て、猫が宙返りする。リストや買い物で上がったぶんも、次にホームを開いたときに祝う。
- **レベルで増える見た目**: キャラの定義の `growth` (`level`、`name`、`layer` = `head` / `tail`、絵)。猫は Lv.2 ほっぺの光、Lv.3 すずの首輪 (首のアクセサリーを着けているあいだは出さない)、Lv.5 しっぽの星。`<Character level={...} />` で描く。足すときは `characters/cat.tsx` の `growth` に 1 つ足す。

## 新しいキャラを足す (5 行)

1. `characters/cat.tsx` を `characters/dog.tsx` にコピーし、`key`、`name`、`viewBox` を書き換える。
2. `parts` (tail / body / head / pawLeft / pawRight / face の happy・sad・joy) を、viewBox の座標で描き直す。
3. `pivots` (しっぽの付け根、目の高さ、手の中心) と `slots` (頭のてっぺん、両目の間、あごの下。`scale` は猫を 1 とした大きさ) を合わせる。
4. 特定のアクセサリーだけずれるなら、`accessoryAdjust: { hat: { dy: -6 } }` のように補正する (アクセサリーの絵は作り直さない)。
5. `characters/index.ts` の `CHARACTERS` に 1 行足し、`<Character definition={CHARACTERS.dog} />` で描く。

アクセサリーを足すときは、`accessories.tsx` に `key` (backend の `items.key` と同じ)、`slot`、絵 (slot の中心が 0,0) を足す。
おみやげ (予算内クリアのドロップ) 限定の帽子は、`items.rarity` に値を入れる (`straw` `beanie` `chef` `wizard`)。ショップの棚には出ず、持っていれば「きがえ」に出る。箱の演出は `features/shopping/components/Souvenir.tsx`。
将来は `profiles` にキャラの key、`items` に slot の列を足せば、DB から選べる。
