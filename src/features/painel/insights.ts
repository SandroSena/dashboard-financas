import { currentMonthKey, daysInMonth, monthName, shiftMonth } from '@/domain/month'
import { toCents } from '@/domain/money'
import { FALLBACK_COLOR, type CategorySlice } from '@/domain/summary'
import type { Kind, Transaction } from '@/domain/types'
import { centsByCategory, sumCents, type DashboardModel } from '@/features/painel/model'
import type { CompareMode } from '@/features/painel/params'

/*
  Leituras do mês sobre o modelo: comparação (mês anterior ou média de 3 meses), ritmo
  acumulado, projeção, variação por categoria e metas. Função pura, sem React.
  Somas em centavos; saída em reais.
*/

/** Quantos meses entram na média (spec do painel, "Definições de cálculo"). */
export const AVERAGE_MONTHS = 3
/** Linhas da lista "Para onde foi o dinheiro"; a última vira "Outras (n)" quando sobra categoria. */
export const MAX_CATEGORY_ROWS = 6
export const OTHERS_ID = '__outros__'
/** "Outras" e lançamento sem categoria usam a cor Ardósia (design system 4.2). */
export const OTHERS_COLOR = FALLBACK_COLOR
/** Gasto 3 pontos ou mais à frente do calendário acende o alerta da régua. */
export const AHEAD_THRESHOLD = 0.03

export type Comparison = {
  mode: CompareMode
  /** Meses que entraram na conta (o anterior, ou os da média que tinham lançamento). */
  monthKeys: string[]
  income: number
  expense: number
  balance: number
  /** Gasto acumulado por dia do mês aberto (índice 0 = dia 1). */
  cumulative: number[]
  /** Total por categoria (gastos e receitas), em reais. */
  byCategory: ReadonlyMap<string, number>
}

/** Textos que dependem do modo de comparação (spec, seção 7). */
export type ComparisonCopy = {
  /** Série e legenda: "Outubro" / "Média de 3 meses". */
  name: string
  /** Frase do leitor de tela no Delta: "outubro" / "a média de 3 meses". */
  phrase: string
  /** Ao lado do Delta: "vs outubro" / "vs média de 3 meses". */
  deltaLabel: string
  /** Sem comparação: "Sem outubro para comparar" / "Sem meses anteriores para a média". */
  emptyLabel: string
  /** Leitura da régua: "Em outubro, nesse dia" / "Na média, nesse dia". */
  sameDay: string
  /** "Em outubro, até o dia" / "Na média, até o dia". */
  untilDay: string
  /** Diferença: "a mais que em outubro" / "acima da média de 3 meses". */
  more: string
  less: string
  /** Descrição do ritmo: "no mesmo ponto de outubro" / "da média de 3 meses". */
  samePoint: string
  /** Anúncio da troca: "Comparando com o mês anterior" / "... com a média de 3 meses". */
  announcement: string
}

export function comparisonCopy(mode: CompareMode, month: string): ComparisonCopy {
  if (mode === 'media') {
    return {
      name: 'Média de 3 meses',
      phrase: 'a média de 3 meses',
      deltaLabel: 'vs média de 3 meses',
      emptyLabel: 'Sem meses anteriores para a média',
      sameDay: 'Na média, nesse dia',
      untilDay: 'Na média, até o dia',
      more: 'acima da média de 3 meses',
      less: 'abaixo da média de 3 meses',
      samePoint: 'da média de 3 meses',
      announcement: 'Comparando com a média de 3 meses',
    }
  }
  const previous = monthName(shiftMonth(month, -1))
  const capitalized = previous.charAt(0).toUpperCase() + previous.slice(1)
  return {
    name: capitalized,
    phrase: previous,
    deltaLabel: `vs ${previous}`,
    emptyLabel: `Sem ${previous} para comparar`,
    sameDay: `Em ${previous}, nesse dia`,
    untilDay: `Em ${previous}, até o dia`,
    more: `a mais que em ${previous}`,
    less: `a menos que em ${previous}`,
    samePoint: `no mesmo ponto de ${previous}`,
    announcement: 'Comparando com o mês anterior',
  }
}

export type PacePoint = {
  day: number
  /** Acumulado deste mês até o dia; `null` em dias futuros. */
  current: number | null
  comparison: number | null
  projected: number | null
  /** Gasto só naquele dia e quantos lançamentos de gasto. */
  dayExpense: number
  dayCount: number
}

export type CategoryRow = CategorySlice & {
  share: number
  /** Variação percentual contra a comparação; `null` sem base para comparar. */
  change: number | null
  /** Diferença em reais contra a comparação; `null` sem comparação. */
  diff: number | null
  /** A comparação existe, mas a categoria não tinha valor nela ("Nova neste mês"). */
  isNew: boolean
}

export type CategoryBreakdown = {
  kind: Kind
  total: number
  rows: CategoryRow[]
  /** Categorias agrupadas em "Outras (n)", quando há mais de 6. */
  others: (CategoryRow & { items: CategoryRow[] }) | null
}

export type DashboardInsights = {
  compare: CompareMode
  /** `null` quando não há com o que comparar (sem mês anterior / sem meses para a média). */
  comparison: Comparison | null
  incomeChange: number | null
  expenseChange: number | null
  balanceChange: number | null
  pace: PacePoint[]
  totalDays: number
  /** Dias já vividos do mês: todos (passado), até hoje (atual) ou 0 (futuro). */
  daysElapsed: number
  isCurrentMonth: boolean
  isPast: boolean
  isFuture: boolean
  /** Gasto até hoje (no mês atual) ou do mês inteiro. */
  spentToDate: number
  dailyAverage: number
  projectedExpense: number | null
  /** Acumulado da comparação no mesmo dia de hoje. */
  comparisonAtSameDay: number | null
  expenseBreakdown: CategoryBreakdown
  incomeBreakdown: CategoryBreakdown
  /** Categoria de gasto que mais subiu contra a comparação. */
  topGrowth: CategoryRow | null
  remainingBudget: number | null
  /** Quanto cabe por dia nas metas até o fim do mês (só no mês atual). */
  dailyAllowance: number | null
  /** Dias que faltam contando hoje (mês atual). */
  daysLeft: number
}

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

/** Acumulado de gasto por dia de um mês, em centavos (índice 0 = dia 1). */
export function cumulativeExpenseCents(month: string, items: readonly Transaction[]): number[] {
  const perDay = new Array<number>(daysInMonth(month).length).fill(0)
  for (const transaction of items) {
    if (transaction.kind !== 'expense' || !transaction.occurredOn.startsWith(`${month}-`)) continue
    const index = Number(transaction.occurredOn.slice(-2)) - 1
    if (index >= 0 && index < perDay.length) perDay[index] += toCents(transaction.amount)
  }
  let run = 0
  return perDay.map((value) => (run += value))
}

/**
  Base de comparação do mês aberto.
  - `anterior`: o mês anterior, se teve algum lançamento.
  - `media`: média dos 3 meses antes do aberto que tiveram algum lançamento (os vazios não
    entram na conta). No ritmo, média do acumulado de cada dia; dia que não existe num mês
    curto (31 em setembro) usa o último dia dele.
  Sem nenhum mês válido, devolve `null` (a tela mostra "Sem ... para comparar").
*/
export function buildComparison(model: DashboardModel, mode: CompareMode): Comparison | null {
  const candidates =
    mode === 'anterior'
      ? [shiftMonth(model.month, -1)]
      : Array.from({ length: AVERAGE_MONTHS }, (_, index) => shiftMonth(model.month, -(index + 1)))
  const monthKeys = candidates.filter((key) => (model.byMonth.get(key)?.length ?? 0) > 0)
  if (monthKeys.length === 0) return null

  const count = monthKeys.length
  const average = (cents: number) => Math.round(cents / count) / 100
  let income = 0
  let expense = 0
  const categoryCents = new Map<string, number>()
  const cumulativeSum = new Array<number>(model.days.length).fill(0)

  for (const key of monthKeys) {
    const items = model.byMonth.get(key) ?? []
    income += sumCents(items, 'income')
    expense += sumCents(items, 'expense')
    for (const kind of ['expense', 'income'] as const) {
      for (const [categoryId, cents] of centsByCategory(items, kind)) {
        categoryCents.set(categoryId, (categoryCents.get(categoryId) ?? 0) + cents)
      }
    }
    const cumulative = cumulativeExpenseCents(key, items)
    for (let index = 0; index < cumulativeSum.length; index++) {
      cumulativeSum[index] += cumulative[Math.min(index, cumulative.length - 1)] ?? 0
    }
  }

  return {
    mode,
    monthKeys,
    income: average(income),
    expense: average(expense),
    balance: average(income - expense),
    cumulative: cumulativeSum.map(average),
    byCategory: new Map([...categoryCents].map(([id, cents]) => [id, average(cents)])),
  }
}

function categoryRows(
  slices: readonly CategorySlice[],
  total: number,
  comparison: Comparison | null,
): CategoryRow[] {
  return slices.map((slice) => {
    const base = comparison?.byCategory.get(slice.categoryId) ?? 0
    return {
      ...slice,
      share: total > 0 ? slice.total / total : 0,
      change: comparison ? percentChange(slice.total, base) : null,
      diff: comparison ? (toCents(slice.total) - toCents(base)) / 100 : null,
      isNew: comparison !== null && base <= 0,
    }
  })
}

/** Até 6 linhas; com mais categorias, as 5 maiores e "Outras (n)" com as demais dentro. */
export function foldCategories(rows: CategoryRow[], total: number, kind: Kind): CategoryBreakdown {
  if (rows.length <= MAX_CATEGORY_ROWS) return { kind, total, rows, others: null }
  const head = rows.slice(0, MAX_CATEGORY_ROWS - 1)
  const rest = rows.slice(MAX_CATEGORY_ROWS - 1)
  const restCents = rest.reduce((sum, row) => sum + toCents(row.total), 0)
  return {
    kind,
    total,
    rows: head,
    others: {
      categoryId: OTHERS_ID,
      name: `Outras (${rest.length})`,
      color: OTHERS_COLOR,
      total: restCents / 100,
      share: total > 0 ? restCents / 100 / total : 0,
      change: null,
      diff: null,
      isNew: false,
      items: rest,
    },
  }
}

export function buildInsights(
  model: DashboardModel,
  { compare = 'anterior', today = new Date() }: { compare?: CompareMode; today?: Date } = {},
): DashboardInsights {
  const month = model.month
  const thisMonth = currentMonthKey(today)
  const totalDays = model.days.length
  const daysElapsed = elapsedDays(month, today)
  const isCurrentMonth = month === thisMonth
  const comparison = buildComparison(model, compare)

  let spentCents = 0
  for (const day of model.days) if (day.day <= daysElapsed) spentCents += toCents(day.expense)
  const spentToDate = spentCents / 100
  const dailyAverageCents = daysElapsed > 0 ? Math.round(spentCents / daysElapsed) : 0
  const showProjection = isCurrentMonth && daysElapsed > 0 && daysElapsed < totalDays && spentCents > 0
  const projectedExpense = showProjection ? (spentCents + dailyAverageCents * (totalDays - daysElapsed)) / 100 : null

  let run = 0
  const pace: PacePoint[] = model.days.map((day, index) => {
    run += toCents(day.expense)
    return {
      day: day.day,
      current: day.day <= daysElapsed ? run / 100 : null,
      comparison: comparison ? (comparison.cumulative[index] ?? null) : null,
      projected:
        showProjection && day.day >= daysElapsed
          ? (spentCents + dailyAverageCents * (day.day - daysElapsed)) / 100
          : null,
      dayExpense: day.expense,
      dayCount: day.expenseCount,
    }
  })

  const remainingCents = model.overall.limit > 0 ? toCents(model.overall.limit) - toCents(model.overall.spent) : null
  const daysLeft = isCurrentMonth ? totalDays - daysElapsed + 1 : 0
  const expenseRows = categoryRows(model.expenseSlices, model.expense, comparison)
  const topGrowth = comparison
    ? expenseRows.reduce<CategoryRow | null>(
        (best, row) => (row.diff !== null && row.diff > 0 && (best === null || row.diff > (best.diff ?? 0)) ? row : best),
        null,
      )
    : null

  return {
    compare,
    comparison,
    incomeChange: comparison ? percentChange(model.income, comparison.income) : null,
    expenseChange: comparison ? percentChange(model.expense, comparison.expense) : null,
    balanceChange: comparison ? (toCents(model.balance) - toCents(comparison.balance)) / 100 : null,
    pace,
    totalDays,
    daysElapsed,
    isCurrentMonth,
    isPast: month < thisMonth,
    isFuture: month > thisMonth,
    spentToDate,
    dailyAverage: dailyAverageCents / 100,
    projectedExpense,
    comparisonAtSameDay: comparison && daysElapsed > 0 ? (comparison.cumulative[daysElapsed - 1] ?? null) : null,
    expenseBreakdown: foldCategories(expenseRows, model.expense, 'expense'),
    incomeBreakdown: foldCategories(categoryRows(model.incomeSlices, model.income, comparison), model.income, 'income'),
    topGrowth,
    remainingBudget: remainingCents === null ? null : remainingCents / 100,
    dailyAllowance:
      remainingCents !== null && remainingCents > 0 && daysLeft > 0 ? Math.round(remainingCents / daysLeft) / 100 : null,
    daysLeft,
  }
}

/** Diferença do ritmo no dia (este mês − comparação), em reais; `null` sem os dois valores. */
export function paceDiff(point: PacePoint | undefined): number | null {
  if (!point || point.current === null || point.comparison === null) return null
  return (toCents(point.current) - toCents(point.comparison)) / 100
}

export type MonthHeadline = {
  /** Rótulo acima do número: "Saldo livre do mês" / "Saldo negativo do mês" / "Resumo do mês". */
  label: string
  /** "Sobram", "Sobraram", "Faltam", "Faltaram", "Já saíram", "Saíram", "Em novembro". */
  verb: string
  value: number
  negative: boolean
}

/** Linha do número do destaque (spec 4.2 e 7), no tempo verbal do mês. */
export function monthHeadline(model: DashboardModel, insights: DashboardInsights): MonthHeadline {
  const name = monthName(model.month)
  if (insights.isFuture) return { label: 'Resumo do mês', verb: `Em ${name}`, value: model.balance, negative: false }
  if (model.income <= 0) {
    return model.expense > 0
      ? { label: 'Resumo do mês', verb: insights.isPast ? 'Saíram' : 'Já saíram', value: model.expense, negative: false }
      : { label: 'Resumo do mês', verb: `Em ${name}`, value: 0, negative: false }
  }
  if (model.balance < 0) {
    return { label: 'Saldo negativo do mês', verb: insights.isPast ? 'Faltaram' : 'Faltam', value: -model.balance, negative: true }
  }
  return { label: 'Saldo livre do mês', verb: insights.isPast ? 'Sobraram' : 'Sobram', value: model.balance, negative: false }
}
