import type { Profile, ProfileRepo } from '../repository'

export const createMemoryProfileRepo = (): ProfileRepo => {
  const profiles = new Map<string, Profile>()
  // supabase ではサインアップ時のトリガーで作られる行を、初回アクセスで作る
  const ensure = (id: string): Profile => {
    const existing = profiles.get(id)
    if (existing) return existing
    const created: Profile = {
      id,
      petName: 'ぷち',
      lastLoginRewardOn: null,
      lastListRewardOn: null,
      lastShoppingJudgedOn: null,
    }
    profiles.set(id, created)
    return created
  }

  return {
    get: async (id) => ensure(id),
    claimLoginReward: async (id, today) => {
      const profile = ensure(id)
      if (profile.lastLoginRewardOn === today) return false
      profiles.set(id, { ...profile, lastLoginRewardOn: today })
      return true
    },
    claimListReward: async (id, today) => {
      const profile = ensure(id)
      if (profile.lastListRewardOn === today) return false
      profiles.set(id, { ...profile, lastListRewardOn: today })
      return true
    },
    markShoppingJudged: async (id, today) => {
      profiles.set(id, { ...ensure(id), lastShoppingJudgedOn: today })
    },
  }
}
