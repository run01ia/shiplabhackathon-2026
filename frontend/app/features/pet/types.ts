import type { ReactNode } from 'react'

/** アクセサリーの取り付け位置。同じ slot に着けられるのは 1 つだけ */
export type Slot = 'head' | 'face' | 'neck'
/** 描く順 (下から上) */
export const SLOTS: readonly Slot[] = ['neck', 'face', 'head']

/** sleep = 居眠り (しばらく操作がないとき) */
export type Mood = 'happy' | 'sad' | 'joy' | 'sleep'
export type Side = 'left' | 'right'

/** アニメーションはこの名前でパーツを指す (キャラに依存しない) */
export type PartName =
  | 'tail'
  | 'body'
  | 'head'
  | 'eyes'
  | 'mouth'
  | 'pawLeft'
  | 'pawRight'
  | 'earLeft'
  | 'earRight'

export type Point = { x: number; y: number }

/** slot の中心。scale は「猫 = 1」を基準にした、そのキャラの頭や首の大きさ */
export type SlotAnchor = Point & { scale?: number; rotate?: number }

/** 特定のアクセサリーだけ、そのキャラ用にずらす補正 */
export type AccessoryAdjust = { dx?: number; dy?: number; scale?: number; rotate?: number }

/**
 * キャラ 1 体ぶんの定義。絵 (パーツ) と座標だけを持ち、動きは <Character> が付ける。
 * パーツは viewBox の座標でそのまま描く (描画順: tail → body → 耳 → head → 顔 → アクセサリー → 手)。
 */
export type CharacterDefinition = {
  key: string
  name: string
  viewBox: { width: number; height: number }
  parts: {
    tail: ReactNode
    body: ReactNode
    head: ReactNode
    pawLeft: ReactNode
    pawRight: ReactNode
    /** 耳 (頭の後ろに描く。あれば、ぴくっと動き、しょんぼりで垂れる) */
    earLeft?: ReactNode
    earRight?: ReactNode
    /** 表情ごとの目と口 (目だけがまばたきする) */
    face: Record<Mood, { eyes: ReactNode; mouth: ReactNode }>
  }
  /** 動きの支点。tail = しっぽの付け根、eyes = 目の高さ、paw = 手の中心 (ぺちの火花の位置) */
  pivots: {
    tail: Point
    eyes: Point
    pawLeft: Point
    pawRight: Point
    /** 首 (頭をかしげる支点)。なければ neck の slot */
    head?: Point
    /** 耳の付け根 */
    earLeft?: Point
    earRight?: Point
  }
  slots: Record<Slot, SlotAnchor>
  /** アクセサリーの key ごとの補正 (例: 耳が大きいキャラだけ帽子を上げる) */
  accessoryAdjust?: Partial<Record<string, AccessoryAdjust>>
}

/** アクセサリー 1 つ。絵は slot の中心を (0,0) として描く。キャラを足しても作り直さない */
export type AccessoryDefinition = {
  key: string
  slot: Slot
  art: ReactNode
  /** ショップの棚に出すときの viewBox */
  iconViewBox: string
}
