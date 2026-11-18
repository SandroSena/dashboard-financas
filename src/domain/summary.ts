import { daysInMonth } from '@/domain/month'
import { roundMoney, toCents } from '@/domain/money'
import type { Budget, BudgetStatus, Category, Kind, Transaction } from '@/domain/types'

export type CategorySlice = {
  categoryId: string
  name: string
  color: string
  total: number
}

export type DayTotal = {
  date: string
  day: number
  total: number
}

export type BudgetProgress = {
  ratio: number
  percent: number
  status: BudgetStatus
}

export type BudgetUsage = BudgetProgress & {
  budget: Budget
  categoryName: string
  color: string
  spent: number
}

/** Cor usada quando o lançamento aponta para uma categoria que não existe mais. */
export const FALLBACK_COLOR = '#64748b'


export function totalByKind(transactions: Transaction[], kind: Kind): number {
  const total = transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + toCents(transaction.amount), 0)
  return total / 100
}

export function balanceOf(transactions: Transaction[]): number {
  return roundMoney(totalByKind(transactions, 'income') - totalByKind(transactions, 'expense'))
}

export function spentByCategory(transactions: Transaction[], categoryId: string): number {
  const total = transactions
    .filter((transaction) => transaction.kind === 'expense' && transaction.categoryId === categoryId)
    .reduce((sum, transaction) => sum + toCents(transaction.amount), 0)
  return total / 100
}

export function expensesByCategory(transactions: Transaction[], categories: Category[]): CategorySlice[] {
  return totalsByCategory(transactions, categories, 'expense')
}

export function totalsByCategory(transactions: Transaction[], categories: Category[], kind: Kind): CategorySlice[] {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.kind !== kind) continue
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + toCents(transaction.amount))
  }

  return [...totals.entries()]
    .map(([categoryId, totalCents]) => {
      const category = categories.find((item) => item.id === categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Sem categoria',
        color: category?.color ?? FALLBACK_COLOR,
        total: totalCents / 100,
      }
    })
    .sort((left, right) => right.total - left.total)
}

export function expensesByDay(transactions: Transaction[], monthKey: string): DayTotal[] {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') continue
    if (!transaction.occurredOn.startsWith(`${monthKey}-`)) continue
    totals.set(
      transaction.occurredOn,
      (totals.get(transaction.occurredOn) ?? 0) + toCents(transaction.amount),
    )
  }

  return daysInMonth(monthKey).map((date) => ({
    date,
    day: Number(date.slice(-2)),
    total: (totals.get(date) ?? 0) / 100,
  }))
}

export function budgetStatusLabel(status: BudgetStatus): string {
  if (status === 'over') return 'Estourado'
  if (status === 'warning') return 'Perto do limite'
  return 'Dentro do limite'
}

export function budgetStatus(spent: number, limit: number): BudgetProgress {
  if (limit <= 0) return { ratio: 0, percent: 0, status: 'ok' }
  const ratio = spent / limit
  const status: BudgetStatus = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok'
  return { ratio, percent: Math.round(ratio * 100), status }
}

export function budgetUsage(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
): BudgetUsage[] {
  return budgets.map((budget) => {
    const category = categories.find((item) => item.id === budget.categoryId)
    const spent = spentByCategory(transactions, budget.categoryId)
    return {
      budget,
      categoryName: category?.name ?? 'Categoria',
      color: category?.color ?? FALLBACK_COLOR,
      spent,
      ...budgetStatus(spent, budget.limitAmount),
    }
  })
}

export function overallBudget(items: BudgetUsage[]): BudgetProgress & { limit: number; spent: number } {
  const limit = items.reduce((sum, item) => sum + toCents(item.budget.limitAmount), 0) / 100
  const spent = items.reduce((sum, item) => sum + toCents(item.spent), 0) / 100
  if (limit <= 0) return { limit: 0, spent, ratio: 0, percent: 0, status: 'ok' }
  return { limit, spent, ...budgetStatus(spent, limit) }
}
