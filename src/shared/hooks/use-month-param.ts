import { isMonthKey, currentMonthKey, shiftMonth } from '@/domain/month'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

export function useMonthParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('mes') ?? ''
  const month = isMonthKey(raw) ? raw : currentMonthKey()

  useEffect(() => {
    if (searchParams.get('mes') === month) return
    const next = new URLSearchParams(searchParams)
    next.set('mes', month)
    setSearchParams(next, { replace: true })
  }, [month, searchParams, setSearchParams])

  function setMonth(nextMonth: string) {
    const next = new URLSearchParams(searchParams)
    next.set('mes', nextMonth)
    setSearchParams(next)
  }

  return {
    month,
    setMonth,
    shift: (delta: number) => setMonth(shiftMonth(month, delta)),
  }
}
