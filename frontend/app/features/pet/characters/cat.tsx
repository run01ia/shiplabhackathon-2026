import { GLINT } from '../animations'
import type { CharacterDefinition, GrowthPart } from '../types'

const S = '#2b2118'
const FUR = '#f6b26b'
const STRIPE = '#e0903f'
const BELLY = '#fff4dc'
const PINK = '#ffb3a7'
const NOSE = '#f2836b'
const TAIL = 'M146 182q42 0 35-38'
const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const paw = (cx: number) => (
  <>
    <ellipse cx={cx} cy="188" rx="17" ry="11" fill={BELLY} stroke={S} strokeWidth="4" />
    <path d={`M${cx - 6} 191v5M${cx + 6} 191v5`} stroke={S} strokeWidth="3" strokeLinecap="round" />
  </>
)

// 丸みのある耳 (外側と、内側のピンク)
const ear = (outer: string, inner: string) => (
  <>
    <path d={outer} fill={FUR} stroke={S} strokeWidth="5" {...round} />
    <path d={inner} fill={PINK} />
  </>
)

// 大きな黒目と、ハイライト 2 つ (生きて見える)
const eye = (cx: number, ry = 10) => (
  <>
    <ellipse cx={cx} cy="106" rx="8.5" ry={ry} fill={S} />
    <circle cx={cx + 3} cy="102" r="3.2" fill="#fff" />
    <circle cx={cx - 2.5} cy="110.5" r="1.5" fill="#fff" />
  </>
)

// 4 つの角がある小さな光 (中心 cx, cy、大きさ r)
const glint = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}q${r * 0.18} ${r * 0.82} ${r} ${r}q-${r * 0.82} ${r * 0.18}-${r} ${r}q-${r * 0.18}-${r * 0.82}-${r}-${r}q${r * 0.82}-${r * 0.18} ${r}-${r}z`
const COLLAR = 'M61 161q39 19 78 0'

/** 育つと増える見た目。帽子やめがねを着けていても見える場所 (ほっぺ・首・しっぽ) に置く */
const growth: readonly GrowthPart[] = [
  {
    key: 'cheek-glint',
    level: 2,
    name: 'きらきらのほっぺ',
    layer: 'head',
    art: (
      <>
        <path d={glint(53, 124, 6.5)} fill="#fff" className={GLINT} />
        <path d={glint(147, 124, 6.5)} fill="#fff" className={`${GLINT} [animation-delay:-1.3s]`} />
      </>
    ),
  },
  {
    key: 'bell-collar',
    level: 3,
    name: 'すずの首輪',
    layer: 'head',
    hiddenBy: 'neck',
    art: (
      <>
        <path d={COLLAR} fill="none" stroke={S} strokeWidth="12" strokeLinecap="round" />
        <path d={COLLAR} fill="none" stroke="#f2542d" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="174" r="8" fill="#ffc93c" stroke={S} strokeWidth="3.5" />
        <path d="M94 173h12M100 175v5" stroke={S} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'tail-star',
    level: 5,
    name: 'しっぽの星',
    layer: 'tail',
    art: (
      <path
        d="M181 124l4.4 9 9.9 1.4-7.2 7 1.7 9.8-8.8-4.6-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z"
        fill="#ffc93c"
        stroke={S}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    ),
  },
]

/** 最初の 1 体。新しいキャラはこのファイルをコピーして作る (README.md) */
export const cat: CharacterDefinition = {
  key: 'cat',
  name: 'ねこ',
  viewBox: { width: 200, height: 204 },
  parts: {
    tail: (
      <>
        <path d={TAIL} fill="none" stroke={S} strokeWidth="20" strokeLinecap="round" />
        <path d={TAIL} fill="none" stroke={FUR} strokeWidth="11" strokeLinecap="round" />
        <path d="M181 152q1-4 0-8" fill="none" stroke={BELLY} strokeWidth="11" {...round} />
      </>
    ),
    body: (
      <>
        <path
          d="M100 146c34 0 55 14 55 32c0 14-22 22-55 22s-55-8-55-22c0-18 21-32 55-32z"
          fill={FUR}
          stroke={S}
          strokeWidth="5"
        />
        <ellipse cx="100" cy="185" rx="27" ry="14" fill={BELLY} />
      </>
    ),
    earLeft: ear(
      'M41 86C33 60 33 40 39 27c16 4 34 16 48 32z',
      'M49 68c-3-11-3-20-1-27c8 3 16 8 23 15z',
    ),
    earRight: ear(
      'M159 86c8-26 8-46 2-59c-16 4-34 16-48 32z',
      'M151 68c3-11 3-20 1-27c-8 3-16 8-23 15z',
    ),
    head: (
      <>
        {/* 下ぶくれの輪郭 (ほっぺが少し張る) */}
        <path
          d="M100 52c41 0 72 25 72 62c0 37-31 58-72 58s-72-21-72-58c0-37 31-62 72-62z"
          fill={FUR}
          stroke={S}
          strokeWidth="5"
        />
        <path d="M90 58v9M100 56v12M110 58v9" stroke={STRIPE} strokeWidth="5" {...round} />
        <ellipse cx="58" cy="130" rx="12" ry="8" fill={PINK} />
        <ellipse cx="142" cy="130" rx="12" ry="8" fill={PINK} />
        <path d="M95.5 119.5h9l-4.5 5z" fill={NOSE} stroke={S} strokeWidth="2.5" {...round} />
        <path
          d="M34 116l-18-3M34 126l-18 5M166 116l18-3M166 126l18 5"
          stroke={S}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    ),
    pawLeft: paw(72),
    pawRight: paw(128),
    face: {
      happy: {
        eyes: (
          <>
            {eye(76)}
            {eye(124)}
          </>
        ),
        mouth: (
          <path
            d="M89 128q5.5 7 11 0q5.5 7 11 0"
            fill="none"
            stroke={S}
            strokeWidth="3.5"
            {...round}
          />
        ),
      },
      joy: {
        eyes: (
          <path
            d="M65 111q11-17 22 0M113 111q11-17 22 0"
            fill="none"
            stroke={S}
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        ),
        mouth: (
          <>
            <path d="M89 127q11 17 22 0z" fill="#e2573d" stroke={S} strokeWidth="3.5" {...round} />
            <path d="M95 135q5-4 10 0q-5 5-10 0z" fill={PINK} />
          </>
        ),
      },
      sleep: {
        eyes: (
          <path
            d="M66 106q10 8 20 0M114 106q10 8 20 0"
            fill="none"
            stroke={S}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ),
        mouth: (
          <path
            d="M95 129q5 5 10 0"
            fill="none"
            stroke={S}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ),
      },
      sad: {
        eyes: (
          <>
            {eye(76, 9)}
            {eye(124, 9)}
            <path d="M64 96l17-6M136 96l-17-6" stroke={S} strokeWidth="4" strokeLinecap="round" />
            <path d="M140 118q6 10 0 16q-6-6 0-16z" fill="#7cc7e8" stroke={S} strokeWidth="2" />
          </>
        ),
        mouth: (
          <path
            d="M91 135q9-8 18 0"
            fill="none"
            stroke={S}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ),
      },
    },
  },
  pivots: {
    tail: { x: 146, y: 182 },
    eyes: { x: 100, y: 106 },
    pawLeft: { x: 72, y: 188 },
    pawRight: { x: 128, y: 188 },
    head: { x: 100, y: 170 },
    earLeft: { x: 62, y: 74 },
    earRight: { x: 138, y: 74 },
  },
  slots: {
    head: { x: 100, y: 62 },
    face: { x: 100, y: 106 },
    neck: { x: 100, y: 167 },
  },
  growth,
}
