import { useEffect, useState } from 'react'
import { useCatTap } from './useCatTap'

/** しばらく操作 (tap()) がないと true になる。次の操作で起きる */
export function useDoze(afterMs: number) {
  const { subscribe } = useCatTap()
  const [asleep, setAsleep] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setAsleep(true), afterMs)
    }
    arm()
    const unsubscribe = subscribe(() => {
      setAsleep(false)
      arm()
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [subscribe, afterMs])

  return asleep
}
