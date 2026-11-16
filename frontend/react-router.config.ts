import type { Config } from '@react-router/dev/config'

export default {
  // SPA モード。セッションはブラウザの supabase-js にあるため、データ取得は clientLoader / clientAction に統一する
  ssr: false,
} satisfies Config
