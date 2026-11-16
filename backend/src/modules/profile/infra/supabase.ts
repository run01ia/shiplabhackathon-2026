import type { Db } from '../../../shared/supabase'
import type { ProfileRepo } from '../repository'

export const createSupabaseProfileRepo = (db: Db): ProfileRepo => ({
  async get(userId) {
    const { data, error } = await db
      .from('profiles')
      .select('id, pet_name, last_login_reward_on, last_shopping_judged_on')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id as string,
      petName: data.pet_name as string,
      lastLoginRewardOn: data.last_login_reward_on as string | null,
      lastShoppingJudgedOn: data.last_shopping_judged_on as string | null,
    }
  },
  async markShoppingJudged(userId, today) {
    const { error } = await db
      .from('profiles')
      .update({ last_shopping_judged_on: today })
      .eq('id', userId)
    if (error) throw error
  },
  async claimLoginReward(userId, today) {
    // 条件付き更新なので、同時に呼ばれても 1 回だけ true になる
    const { data, error } = await db
      .from('profiles')
      .update({ last_login_reward_on: today })
      .eq('id', userId)
      .or(`last_login_reward_on.is.null,last_login_reward_on.neq.${today}`)
      .select('id')
    if (error) throw error
    return data.length > 0
  },
})
