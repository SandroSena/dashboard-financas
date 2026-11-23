import { toCents } from '@/domain/money'
import type { BudgetUsage } from '@/domain/summary'
import type { Category, Kind, Transaction } from '@/domain/types'
import { percentChange, type DashboardInsights } from '@/features/painel/insights'
import { shortMonthLabel, type DashboardModel } from '@/features/painel/model'
import type { HistoryWindow } from '@/features/painel/params'

/*
  Folhas de detalhe (spec do painel, 4.11 e 4.12): por categoria (`?categoria=`) e por dia
  (`?dia=`). Funções puras sobre o modelo já calculado; nada é buscado de novo.
*/

export type CategoryMonthBar = {
  key: string
  label: string
  total: number
  isOpen: boolean
}

export type CategoryDetail = {
  category: Category
  kind: Kind
  total: number
  /** Parte do total do tipo no mês (0..1). */
  share: number
  change: number | null
  /** Há comparação, mas a categoria não tinha valor nela. */
  isNew: boolean
  /** Só categorias de gasto têm meta. */
  budget: BudgetUsage | null
  /** Barras dos meses da janela, do mais antigo ao aberto. */
  months: CategoryMonthBar[]
  /** Média mensal da categoria na janela (linha tracejada). */
  average: number
  transactions: Transaction[]
  /** Quanto cabe por dia na meta da categoria até o fim do mês (só no mês atual). */
  dailyAllowance: number | null
}

/**
  Detalhe de uma categoria no mês aberto. Devolve `null` se o id não está nas categorias
  do usuário (excluída ou de outra conta: o RLS não devolve), para a folha não abrir (AC-15).
*/
export function buildCategoryDetail(
  categoryId: string,
  model: DashboardModel,
  insights: DashboardInsights,
  window: HistoryWindow,
): CategoryDetail | null {
  const category = model.categoryById.get(categoryId)
  if (!category) return null

  const transactions = model.transactions.filter((transaction) => transaction.categoryId === categoryId)
  const totalCents = transactions.reduce((sum, transaction) => sum + toCents(transaction.amount), 0)
  const kindTotal = category.kind === 'expense' ? model.expense : model.income
  const comparisonValue = insights.comparison?.byCategory.get(categoryId) ?? 0

  const months = model.months.slice(-window).map((point) => {
    let cents = 0
    for (const transaction of model.byMonth.get(point.key) ?? []) {
      if (transaction.categoryId === categoryId) cents += toCents(transaction.amount)
    }
    return { key: point.key, label: shortMonthLabel(point.key), total: cents / 100, isOpen: point.key === model.month }
  })
  const averageCents = months.reduce((sum, bar) => sum + toCents(bar.total), 0) / Math.max(months.length, 1)

  const budget =
    category.kind === 'expense' ? (model.usage.find((item) => item.budget.categoryId === categoryId) ?? null) : null
  const remainingCents = budget ? toCents(budget.budget.limitAmount) - toCents(budget.spent) : 0

  return {
    category,
    kind: category.kind,
    total: totalCents / 100,
    share: kindTotal > 0 ? totalCents / 100 / kindTotal : 0,
    change: insights.comparison ? percentChange(totalCents / 100, comparisonValue) : null,
    isNew: insights.comparison !== null && comparisonValue <= 0 && totalCents > 0,
    budget,
    months,
    average: Math.round(averageCents) / 100,
    transactions,
    dailyAllowance:
      budget && remainingCents > 0 && insights.isCurrentMonth && insights.daysLeft > 0
        ? Math.round(remainingCents / insights.daysLeft) / 100
        : null,
  }
}

export type DayDetail = {
  date: string
  day: number
  totalDays: number
  expense: number
  income: number
  transactions: Transaction[]
  /** Média de gasto por dia no mês (até hoje). */
  dailyAverage: number
  /** O gasto do dia contra a média; `null` sem média (nenhum gasto no mês ainda). */
  versusAverage: 'above' | 'below' | 'equal' | null
}

/** Detalhe de um dia do mês aberto; `null` se a data não é deste mês. */
export function buildDayDetail(date: string, model: DashboardModel, insights: DashboardInsights): DayDetail | null {
  const stat = model.days.find((day) => day.date === date)
  if (!stat) return null
  const average = insights.dailyAverage
  const versusAverage =
    average <= 0
      ? null
      : toCents(stat.expense) > toCents(average)
        ? 'above'
        : toCents(stat.expense) < toCents(average)
          ? 'below'
          : 'equal'
  return {
    date,
    day: stat.day,
    totalDays: model.days.length,
    expense: stat.expense,
    income: stat.income,
    transactions: model.transactions.filter((transaction) => transaction.occurredOn === date),
    dailyAverage: average,
    versusAverage,
  }
}
