import { supabase } from '~/lib/supabase'

type Result = { error: string | null; needsConfirm?: boolean }

export const signIn = async (email: string, password: string): Promise<Result> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message ?? null }
}

export const signUp = async (email: string, password: string): Promise<Result> => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return data.session ? { error: null } : { error: null, needsConfirm: true }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}
