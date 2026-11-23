import { capitalize, daysInMonth, monthBounds, shiftMonth } from '@/domain/month'
import { toCents } from '@/domain/money'
import { FALLBACK_COLOR, budgetStatus, type BudgetProgress, type BudgetUsage, type CategorySlice } from '@/domain/summary'
import type { Budget, Category, Kind, Transaction } from '@/domain/types'
import { MAX_WINDOW } from '@/features/painel/params'

/*
  Modelo do painel: tudo o que a tela mostra sobre o mês aberto, calculado uma vez a partir
  de categorias, lançamentos (12 meses) e metas. Função pura, sem React.

  Dinheiro: toda soma é feita em centavos inteiros (`toCents`) e só vira reais na saída,
  porque os componentes (`Amount`, `formatBrl`) recebem reais.
*/

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export type MonthPoint = {
  key: string
  /** "Set" */
  label: string
  income: number
  expense: number
  balance: number
  /** Número de lançamentos (0 = mês sem movimento). */
  count: number
}

export type DayStat = {
  date: string
  day: number
  expense: number
  income: number
  expenseCount: number
  incomeCount: number
  /** Maior gasto do dia (para a dica do calendário). */
  topExpense: Transaction | null
}

export type DashboardModel = {
  month: string
  income: number
  expense: number
  balance: number
  /** Parte da receita que sobrou, em pontos inteiros; `null` sem receita. */
  savingsPercent: number | null
  incomeCount: number
  expenseCount: number
  averageExpense: number
  largestExpense: Transaction | null
  expenseSlices: CategorySlice[]
  incomeSlices: CategorySlice[]
  days: DayStat[]
  /** Os 12 meses que terminam no mês aberto, do mais antigo ao aberto. */
  months: MonthPoint[]
  usage: BudgetUsage[]
  overall: BudgetProgress & { limit: number; spent: number }
  /** Lançamentos do mês, do mais recente ao mais antigo. */
  transactions: Transaction[]
  recent: Transaction[]
  categoryById: ReadonlyMap<string, Category>
  /** Lançamentos de cada mês (`AAAA-MM`) do histórico carregado. */
  byMonth: ReadonlyMap<string, Transaction[]>
}

/** Intervalo buscado no banco: `months` meses terminando no mês aberto (AC-10). */
export function historyBounds(month: string, months: number = MAX_WINDOW): { start: string; end: string } {
  return {
    start: `${shiftMonth(month, -(months - 1))}-01`,
    end: monthBounds(month).end,
  }
}

/** "2026-09" → "Set". */
export function shortMonthLabel(monthKey: string): string {
  return MONTH_SHORT[Number(monthKey.slice(5, 7)) - 1] ?? capitalize(monthKey)
}

/** Agrupa o histórico por mês numa passada só (base de todas as contas por mês). */
export function groupByMonth(history: readonly Transaction[]): Map<string, Transaction[]> {
  const byMonth = new Map<string, Transaction[]>()
  for (const transaction of history) {
    const key = transaction.occurredOn.slice(0, 7)
    const bucket = byMonth.get(key)
    if (bucket) bucket.push(transaction)
    else byMonth.set(key, [transaction])
  }
  return byMonth
}

/** Soma em centavos de um tipo. */
export function sumCents(transactions: readonly Transaction[], kind: Kind): number {
  let total = 0
  for (const transaction of transactions) if (transaction.kind === kind) total += toCents(transaction.amount)
  return total
}

/** Totais por categoria de um tipo, em centavos. */
export function centsByCategory(transactions: readonly Transaction[], kind: Kind): Map<string, number> {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.kind !== kind) continue
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + toCents(transaction.amount))
  }
  return totals
}

export function monthPoint(monthKey: string, items: readonly Transaction[]): MonthPoint {
  const income = sumCents(items, 'income')
  const expense = sumCents(items, 'expense')
  return {
    key: monthKey,
    label: shortMonthLabel(monthKey),
    income: income / 100,
    expense: expense / 100,
    balance: (income - expense) / 100,
    count: items.length,
  }
}

function slicesOf(
  totals: Map<string, number>,
  categoryById: ReadonlyMap<string, Category>,
): CategorySlice[] {
  return [...totals.entries()]
    .map(([categoryId, cents]) => {
      const category = categoryById.get(categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Sem categoria',
        color: category?.color ?? FALLBACK_COLOR,
        total: cents / 100,
      }
    })
    .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name, 'pt-BR'))
}

function dayStats(month: string, items: readonly Transaction[]): DayStat[] {
  const byDate = new Map<string, { expense: number; income: number; expenseCount: number; incomeCount: number; top: Transaction | null }>()
  for (const transaction of items) {
    let entry = byDate.get(transaction.occurredOn)
    if (!entry) {
      entry = { expense: 0, income: 0, expenseCount: 0, incomeCount: 0, top: null }
      byDate.set(transaction.occurredOn, entry)
    }
    if (transaction.kind === 'expense') {
      entry.expense += toCents(transaction.amount)
      entry.expenseCount += 1
      if (!entry.top || transaction.amount > entry.top.amount) entry.top = transaction
    } else {
      entry.income += toCents(transaction.amount)
      entry.incomeCount += 1
    }
  }

  return daysInMonth(month).map((date) => {
    const entry = byDate.get(date)
    return {
      date,
      day: Number(date.slice(-2)),
      expense: (entry?.expense ?? 0) / 100,
      income: (entry?.income ?? 0) / 100,
      expenseCount: entry?.expenseCount ?? 0,
      incomeCount: entry?.incomeCount ?? 0,
      topExpense: entry?.top ?? null,
    }
  })
}

function usageOf(
  budgets: readonly Budget[],
  expenseByCategory: Map<string, number>,
  categoryById: ReadonlyMap<string, Category>,
): BudgetUsage[] {
  return budgets
    .map((budget) => {
      const category = categoryById.get(budget.categoryId)
      const spent = (expenseByCategory.get(budget.categoryId) ?? 0) / 100
      return {
        budget,
        categoryName: category?.name ?? 'Categoria',
        color: category?.color ?? FALLBACK_COLOR,
        spent,
        ...budgetStatus(spent, budget.limitAmount),
      }
    })
    // Estouradas, depois em alerta, depois em dia; dentro de cada grupo, pelo percentual.
    .sort((left, right) => right.ratio - left.ratio)
}

function overallOf(usage: readonly BudgetUsage[]): DashboardModel['overall'] {
  let limit = 0
  let spent = 0
  for (const item of usage) {
    limit += toCents(item.budget.limitAmount)
    spent += toCents(item.spent)
  }
  if (limit <= 0) return { limit: 0, spent: spent / 100, ratio: 0, percent: 0, status: 'ok' }
  return { limit: limit / 100, spent: spent / 100, ...budgetStatus(spent / 100, limit / 100) }
}

export function buildDashboardModel(
  month: string,
  categories: readonly Category[],
  history: readonly Transaction[],
  budgets: readonly Budget[],
): DashboardModel {
  const byMonth = groupByMonth(history)
  const inMonth = byMonth.get(month) ?? []
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  const incomeCents = sumCents(inMonth, 'income')
  const expenseCents = sumCents(inMonth, 'expense')
  const balanceCents = incomeCents - expenseCents
  let expenseCount = 0
  let largestExpense: Transaction | null = null
  for (const transaction of inMonth) {
    if (transaction.kind !== 'expense') continue
    expenseCount += 1
    if (!largestExpense || transaction.amount > largestExpense.amount) largestExpense = transaction
  }

  const expenseByCategory = centsByCategory(inMonth, 'expense')
  const usage = usageOf(budgets.filter((budget) => budget.month.startsWith(month)), expenseByCategory, categoryById)
  const transactions = [...inMonth].sort((left, right) => right.occurredOn.localeCompare(left.occurredOn))

  return {
    month,
    income: incomeCents / 100,
    expense: expenseCents / 100,
    balance: balanceCents / 100,
    savingsPercent: incomeCents > 0 ? Math.round((balanceCents / incomeCents) * 100) : null,
    incomeCount: inMonth.length - expenseCount,
    expenseCount,
    averageExpense: expenseCount > 0 ? Math.round(expenseCents / expenseCount) / 100 : 0,
    largestExpense,
    expenseSlices: slicesOf(expenseByCategory, categoryById),
    incomeSlices: slicesOf(centsByCategory(inMonth, 'income'), categoryById),
    days: dayStats(month, inMonth),
    months: Array.from({ length: MAX_WINDOW }, (_, index) => {
      const key = shiftMonth(month, index - (MAX_WINDOW - 1))
      return monthPoint(key, byMonth.get(key) ?? [])
    }),
    usage,
    overall: overallOf(usage),
    transactions,
    recent: transactions.slice(0, 6),
    categoryById,
    byMonth,
  }
}
