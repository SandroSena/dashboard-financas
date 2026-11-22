import { capitalize, daysInMonth, monthBounds, shiftMonth } from '@/domain/month'
import { roundMoney, toCents } from '@/domain/money'
import {
  FALLBACK_COLOR,
  budgetUsage,
  expensesByDay,
  overallBudget,
  totalByKind,
  totalsByCategory,
  type BudgetUsage,
  type CategorySlice,
  type DayTotal,
} from '@/domain/summary'
import type { Budget, Category, Transaction } from '@/domain/types'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const OTHER_ID = '__outros__'
const HISTORY_MONTHS = 6

export type MonthPoint = {
  key: string
  label: string
  income: number
  expense: number
  balance: number
}

export type DayFlow = {
  day: number
  income: number
  expense: number
  net: number
}

export type FlowPoint = {
  day: number
  income: number
  expense: number
  balance: number
}

export type WeekdayPoint = {
  label: string
  income: number
  expense: number
}

export type ScatterPoint = {
  day: number
  amount: number
  name: string
  category: string
  fill: string
}

export type CalendarCell = {
  date: string
  day: number
  total: number
  intensity: number
}

export type StackSeries = {
  id: string
  name: string
  color: string
}

export type DashboardModel = {
  month: string
  income: number
  expense: number
  balance: number
  savingsPercent: number | null
  incomeCount: number
  expenseCount: number
  averageExpense: number
  largestExpense: Transaction | null
  expenseSlices: CategorySlice[]
  incomeSlices: CategorySlice[]
  days: DayTotal[]
  daily: DayFlow[]
  flow: FlowPoint[]
  weekdays: WeekdayPoint[]
  months: MonthPoint[]
  stackSeries: StackSeries[]
  stackPoints: Array<Record<string, string | number>>
  usage: BudgetUsage[]
  overall: ReturnType<typeof overallBudget>
  calendar: CalendarCell[]
  calendarOffset: number
  scatter: ScatterPoint[]
  recent: Transaction[]
  categoryName: Map<string, string>
}

export function historyBounds(month: string): { start: string; end: string } {
  return {
    start: `${shiftMonth(month, -(HISTORY_MONTHS - 1))}-01`,
    end: monthBounds(month).end,
  }
}

export function buildDashboardModel(
  month: string,
  categories: Category[],
  history: Transaction[],
  budgets: Budget[],
): DashboardModel {
  const monthKeys = Array.from({ length: HISTORY_MONTHS }, (_, index) => shiftMonth(month, index - (HISTORY_MONTHS - 1)))
  const inMonth = history.filter((transaction) => transaction.occurredOn.startsWith(`${month}-`))
  const income = totalByKind(inMonth, 'income')
  const expense = totalByKind(inMonth, 'expense')
  const balance = roundMoney(income - expense)
  const expenseCount = inMonth.filter((transaction) => transaction.kind === 'expense').length
  const expenses = inMonth.filter((transaction) => transaction.kind === 'expense')
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  const categoryColor = new Map(categories.map((category) => [category.id, category.color]))
  const days = expensesByDay(inMonth, month)
  const { daily, flow } = dailyFlows(inMonth, month)
  const usage = budgetUsage(budgets, inMonth, categories).sort((left, right) => right.ratio - left.ratio)
  const trend = categoryTrend(history, categories, monthKeys)

  return {
    month,
    income,
    expense,
    balance,
    savingsPercent: income > 0 ? Math.round((balance / income) * 100) : null,
    incomeCount: inMonth.filter((transaction) => transaction.kind === 'income').length,
    expenseCount,
    averageExpense: expenseCount > 0 ? roundMoney(expense / expenseCount) : 0,
    largestExpense: expenses.reduce<Transaction | null>(
      (largest, transaction) => (largest === null || transaction.amount > largest.amount ? transaction : largest),
      null,
    ),
    expenseSlices: totalsByCategory(inMonth, categories, 'expense'),
    incomeSlices: totalsByCategory(inMonth, categories, 'income'),
    days,
    daily,
    flow,
    weekdays: weekdayTotals(inMonth),
    months: monthKeys.map((key) => monthPoint(key, history)),
    stackSeries: trend.series,
    stackPoints: trend.points,
    usage,
    overall: overallBudget(usage),
    ...calendarOf(days),
    scatter: expenses.map((transaction) => ({
      day: Number(transaction.occurredOn.slice(-2)),
      amount: transaction.amount,
      name: transaction.description,
      category: categoryName.get(transaction.categoryId) ?? 'Sem categoria',
      fill: categoryColor.get(transaction.categoryId) ?? FALLBACK_COLOR,
    })),
    recent: [...inMonth].sort((left, right) => right.occurredOn.localeCompare(left.occurredOn)).slice(0, 6),
    categoryName,
  }
}

function monthPoint(monthKey: string, history: Transaction[]): MonthPoint {
  const items = history.filter((transaction) => transaction.occurredOn.startsWith(`${monthKey}-`))
  const income = totalByKind(items, 'income')
  const expense = totalByKind(items, 'expense')
  return {
    key: monthKey,
    label: shortMonth(monthKey),
    income,
    expense,
    balance: roundMoney(income - expense),
  }
}

function shortMonth(monthKey: string): string {
  const label = format(parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date(2000, 0, 1)), 'MMM', { locale: ptBR }).replace('.', '')
  return capitalize(label)
}

function dailyFlows(transactions: Transaction[], month: string): { daily: DayFlow[]; flow: FlowPoint[] } {
  const income = new Map<string, number>()
  const expense = new Map<string, number>()
  for (const transaction of transactions) {
    if (!transaction.occurredOn.startsWith(`${month}-`)) continue
    const bucket = transaction.kind === 'income' ? income : expense
    bucket.set(transaction.occurredOn, (bucket.get(transaction.occurredOn) ?? 0) + toCents(transaction.amount))
  }

  let incomeRun = 0
  let expenseRun = 0
  const daily: DayFlow[] = []
  const flow: FlowPoint[] = []

  for (const date of daysInMonth(month)) {
    const dayIncome = income.get(date) ?? 0
    const dayExpense = expense.get(date) ?? 0
    incomeRun += dayIncome
    expenseRun += dayExpense
    const day = Number(date.slice(-2))
    daily.push({
      day,
      income: dayIncome / 100,
      expense: dayExpense / 100,
      net: (dayIncome - dayExpense) / 100,
    })
    flow.push({
      day,
      income: incomeRun / 100,
      expense: expenseRun / 100,
      balance: (incomeRun - expenseRun) / 100,
    })
  }

  return { daily, flow }
}

function weekdayTotals(transactions: Transaction[]): WeekdayPoint[] {
  const income = Array.from({ length: 7 }, () => 0)
  const expense = Array.from({ length: 7 }, () => 0)
  for (const transaction of transactions) {
    const [year, month, day] = transaction.occurredOn.split('-').map(Number)
    const index = new Date(year, month - 1, day).getDay()
    const bucket = transaction.kind === 'income' ? income : expense
    bucket[index] += toCents(transaction.amount)
  }
  return WEEKDAY_LABELS.map((label, index) => ({
    label,
    income: income[index] / 100,
    expense: expense[index] / 100,
  }))
}

function categoryTrend(
  history: Transaction[],
  categories: Category[],
  monthKeys: string[],
): { series: StackSeries[]; points: Array<Record<string, string | number>> } {
  const perMonth = monthKeys.map((key) => {
    const totals = new Map<string, number>()
    for (const transaction of history) {
      if (transaction.kind !== 'expense' || !transaction.occurredOn.startsWith(`${key}-`)) continue
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + toCents(transaction.amount))
    }
    return totals
  })

  const grand = new Map<string, number>()
  for (const monthTotals of perMonth) {
    for (const [categoryId, total] of monthTotals) grand.set(categoryId, (grand.get(categoryId) ?? 0) + total)
  }

  const ranked = [...grand.entries()].sort((left, right) => right[1] - left[1])
  const top = ranked.slice(0, 4).map(([categoryId]) => categoryId)
  const topSet = new Set(top)
  const series: StackSeries[] = top.map((categoryId) => {
    const category = categories.find((item) => item.id === categoryId)
    return {
      id: categoryId,
      name: category?.name ?? 'Sem categoria',
      color: category?.color ?? FALLBACK_COLOR,
    }
  })
  if (ranked.length > top.length) series.push({ id: OTHER_ID, name: 'Outros', color: FALLBACK_COLOR })

  const points = monthKeys.map((key, index) => {
    const row: Record<string, string | number> = { label: shortMonth(key) }
    for (const categoryId of top) row[categoryId] = (perMonth[index].get(categoryId) ?? 0) / 100
    if (ranked.length > top.length) {
      let rest = 0
      for (const [categoryId, total] of perMonth[index]) {
        if (!topSet.has(categoryId)) rest += total
      }
      row[OTHER_ID] = rest / 100
    }
    return row
  })

  return { series, points }
}

function calendarOf(days: DayTotal[]): { calendar: CalendarCell[]; calendarOffset: number } {
  const peak = days.reduce((max, day) => Math.max(max, day.total), 0)
  const [year, monthNumber] = (days[0]?.date ?? '2000-01-01').split('-').map(Number)
  return {
    calendarOffset: new Date(year, monthNumber - 1, 1).getDay(),
    calendar: days.map((day) => ({
      date: day.date,
      day: day.day,
      total: day.total,
      intensity: peak > 0 ? day.total / peak : 0,
    })),
  }
}
