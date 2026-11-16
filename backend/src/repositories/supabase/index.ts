import type { Db } from '../../lib/supabase'
import type { ListStatus, Repositories } from '../types'

// 行 (snake_case) ↔ 型 (camelCase) の変換だけ。ビジネス判定はしない
export const createSupabaseRepositories = (db: Db): Repositories => ({
  profiles: {
    async get(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('id, pet_name, last_login_reward_on')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        id: data.id as string,
        petName: data.pet_name as string,
        lastLoginRewardOn: data.last_login_reward_on as string | null,
      }
    },
  },
  lists: {
    async getActive(userId) {
      const { data, error } = await db
        .from('lists')
        .select('id, user_id, budget, status, spent_amount')
        .eq('user_id', userId)
        .neq('status', 'finished')
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        id: data.id as string,
        userId: data.user_id as string,
        budget: data.budget as number,
        status: data.status as ListStatus,
        spentAmount: data.spent_amount as number | null,
      }
    },
  },
  wallets: {
    async get(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('coins, score, level, exp')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
        ? {
            coins: data.coins as number,
            score: data.score as number,
            level: data.level as number,
            exp: data.exp as number,
          }
        : null
    },
    async save(userId, w) {
      const { error } = await db
        .from('profiles')
        .update({ coins: w.coins, score: w.score, level: w.level, exp: w.exp })
        .eq('id', userId)
      if (error) throw error
    },
  },
})
