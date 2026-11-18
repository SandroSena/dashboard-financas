import { currentMonthKey, daysInMonth, shiftMonth } from '@/domain/month'
import { roundMoney, toCents } from '@/domain/money'
import { expensesByDay, type CategorySlice } from '@/domain/summary'
import type { Transaction } from '@/domain/types'
import type { DashboardModel, MonthPoint } from '@/features/painel/model'

export type PacePoint = {
  day: number
  current: number | null
  previous: number | null
  projected: number | null
}

export type CategoryShare = CategorySlice & { share: number }

export type DashboardInsights = {
  previous: MonthPoint | null
  incomeChange: number | null
  expenseChange: number | null
  balanceChange: number | null
  pace: PacePoint[]
  totalDays: number
  daysElapsed: number
  isCurrentMonth: boolean
  dailyAverage: number
  projectedExpense: number | null
  previousAtSameDay: number | null
  categories: CategoryShare[]
  dailyAllowance: number | null
  remainingBudget: number | null
}

const MAX_CATEGORIES = 6

export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function elapsedDays(month: string, today = new Date()): number {
  const total = daysInMonth(month).length
  const thisMonth = currentMonthKey(today)
  if (month < thisMonth) return total
  if (month > thisMonth) return 0
  return Math.min(today.getDate(), total)
}

export function buildInsights(model: DashboardModel, history: Transaction[], today = new Date()): DashboardInsights {
  const month = model.month
  const previousKey = shiftMonth(month, -1)
  const previous = model.months.find((point) => point.key === previousKey) ?? null
  const hasPrevious = previous !== null && (previous.income > 0 || previous.expense > 0)
  const totalDays = model.days.length
  const daysElapsed = elapsedDays(month, today)
  const isCurrentMonth = month === currentMonthKey(today)

  const previousDays = expensesByDay(history, previousKey)
  const previousCumulative: number[] = []
  let previousRun = 0
  for (const day of previousDays) {
    previousRun += toCents(day.total)
    previousCumulative.push(previousRun / 100)
  }

  let currentRun = 0
  const spentToDate = model.days
    .slice(0, daysElapsed)
    .reduce((sum, day) => sum + toCents(day.total), 0) / 100
  const dailyAverage = daysElapsed > 0 ? roundMoney(spentToDate / daysElapsed) : 0
  const showProjection = isCurrentMonth && daysElapsed > 0 && daysElapsed < totalDays && spentToDate > 0
  const projectedExpense = showProjection ? roundMoney(spentToDate + dailyAverage * (totalDays - daysElapsed)) : null

  const pace: PacePoint[] = model.days.map((day, index) => {
    currentRun += toCents(day.total)
    const inRange = day.day <= daysElapsed
    const previousValue = hasPrevious
      ? (previousCumulative[Math.min(index, previousCumulative.length - 1)] ?? null)
      : null
    return {
      day: day.day,
      current: inRange ? currentRun / 100 : null,
      previous: previousValue,
      projected:
        showProjection && day.day >= daysElapsed
          ? roundMoney(spentToDate + dailyAverage * (day.day - daysElapsed))
          : null,
    }
  })

  const previousAtSameDay =
    hasPrevious && daysElapsed > 0
      ? (previousCumulative[Math.min(daysElapsed, previousCumulative.length) - 1] ?? null)
      : null

  const remainingBudget = model.overall.limit > 0 ? roundMoney(model.overall.limit - model.overall.spent) : null
  const daysLeft = totalDays - daysElapsed + (isCurrentMonth ? 1 : 0)
  const dailyAllowance =
    remainingBudget !== null && remainingBudget > 0 && isCurrentMonth && daysLeft > 0
      ? roundMoney(remainingBudget / daysLeft)
      : null

  return {
    previous: hasPrevious ? previous : null,
    incomeChange: hasPrevious ? percentChange(model.income, previous.income) : null,
    expenseChange: hasPrevious ? percentChange(model.expense, previous.expense) : null,
    balanceChange: hasPrevious ? roundMoney(model.balance - previous.balance) : null,
    pace,
    totalDays,
    daysElapsed,
    isCurrentMonth,
    dailyAverage,
    projectedExpense,
    previousAtSameDay,
    categories: foldCategories(model.expenseSlices, model.expense),
    dailyAllowance,
    remainingBudget,
  }
}

export function foldCategories(slices: CategorySlice[], total: number): CategoryShare[] {
  const withShare = (slice: CategorySlice): CategoryShare => ({
    ...slice,
    share: total > 0 ? slice.total / total : 0,
  })
  if (slices.length <= MAX_CATEGORIES) return slices.map(withShare)
  const head = slices.slice(0, MAX_CATEGORIES - 1)
  const rest = slices.slice(MAX_CATEGORIES - 1)
  const restTotal = rest.reduce((sum, slice) => sum + toCents(slice.total), 0) / 100
  return [
    ...head.map(withShare),
    withShare({ categoryId: '__outros__', name: `Outras (${rest.length})`, color: '#94a3b8', total: restTotal }),
  ]
}
