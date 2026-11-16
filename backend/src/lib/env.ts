// Cloudflare Workers の Bindings (c.env)。Node ローカルでは process.env から同じ形で作る
export type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
}

export type AuthUser = { id: string }

// c.var に入る値
export type Variables = { user: AuthUser }

export type Env = { Bindings: Bindings; Variables: Variables }
