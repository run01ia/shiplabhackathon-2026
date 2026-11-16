import type { CharacterDefinition } from '../types'

const S = '#2b2118'
const FUR = '#f6b26b'
const BELLY = '#fff4dc'
const PINK = '#ffb3a7'
const TAIL = 'M146 180q40 2 34-34'

const paw = (cx: number) => (
  <>
    <ellipse cx={cx} cy="187" rx="17" ry="10" fill={BELLY} stroke={S} strokeWidth="4" />
    <path d={`M${cx - 6} 190v5M${cx + 6} 190v5`} stroke={S} strokeWidth="3" strokeLinecap="round" />
  </>
)

/** 最初の 1 体。新しいキャラはこのファイルをコピーして作る (README.md) */
export const cat: CharacterDefinition = {
  key: 'cat',
  name: 'ねこ',
  viewBox: { width: 200, height: 204 },
  parts: {
    tail: (
      <>
        <path d={TAIL} fill="none" stroke={S} strokeWidth="19" strokeLinecap="round" />
        <path d={TAIL} fill="none" stroke={FUR} strokeWidth="10" strokeLinecap="round" />
      </>
    ),
    body: (
      <>
        <ellipse cx="100" cy="172" rx="52" ry="28" fill={FUR} stroke={S} strokeWidth="5" />
        <ellipse cx="100" cy="182" rx="26" ry="15" fill={BELLY} />
      </>
    ),
    head: (
      <>
        <path
          d="M44 78L38 26l48 32z"
          fill={FUR}
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M156 78l6-52-48 32z"
          fill={FUR}
          stroke={S}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M50 66l-3-26 22 15z" fill={PINK} />
        <path d="M150 66l3-26-22 15z" fill={PINK} />
        <ellipse cx="100" cy="112" rx="72" ry="60" fill={FUR} stroke={S} strokeWidth="5" />
        <path
          d="M92 56v14M100 54v16M108 56v14"
          stroke="#c97f2e"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="62" cy="128" rx="13" ry="9" fill={PINK} />
        <ellipse cx="138" cy="128" rx="13" ry="9" fill={PINK} />
        <path
          d="M95 120h10l-5 6z"
          fill="#e2573d"
          stroke={S}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M36 118l-22-4M36 128l-22 6M164 118l22-4M164 128l22 6"
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
            <circle cx="76" cy="106" r="8" fill={S} />
            <circle cx="124" cy="106" r="8" fill={S} />
            <circle cx="79" cy="103" r="3" fill="#fff" />
            <circle cx="127" cy="103" r="3" fill="#fff" />
          </>
        ),
        mouth: (
          <path
            d="M88 130q6 8 12 0q6 8 12 0"
            fill="none"
            stroke={S}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ),
      },
      joy: {
        eyes: (
          <path
            d="M66 109q10-12 20 0M114 109q10-12 20 0"
            fill="none"
            stroke={S}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ),
        mouth: (
          <path
            d="M89 129q11 15 22 0z"
            fill="#e2573d"
            stroke={S}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        ),
      },
      sad: {
        eyes: (
          <>
            <path
              d="M66 104q10 8 20 0M114 104q10 8 20 0"
              fill="none"
              stroke={S}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path d="M146 112q6 10 0 16q-6-6 0-16z" fill="#7cc7e8" stroke={S} strokeWidth="2" />
          </>
        ),
        mouth: (
          <path
            d="M88 138q12-10 24 0"
            fill="none"
            stroke={S}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ),
      },
    },
  },
  pivots: {
    tail: { x: 146, y: 180 },
    eyes: { x: 100, y: 106 },
    pawLeft: { x: 72, y: 187 },
    pawRight: { x: 128, y: 187 },
  },
  slots: {
    head: { x: 100, y: 62 },
    face: { x: 100, y: 106 },
    neck: { x: 100, y: 167 },
  },
}
