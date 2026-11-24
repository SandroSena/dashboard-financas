import type { Budget, Category, Transaction } from '@/domain/types'
import {
  buildComparison,
  buildInsights,
  comparisonCopy,
  elapsedDays,
  foldCategories,
  monthHeadline,
  paceDiff,
  percentChange,
  type CategoryRow,
} from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Alimentação', kind: 'expense', color: '#c2410c' },
  { id: 'fun', name: 'Lazer', kind: 'expense', color: '#7c3aed' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#0e7490' },
]

function tx(id: string, categoryId: string, amount: number, occurredOn: string): Transaction {
  const kind = categoryId === 'salary' ? 'income' : 'expense'
  return { id, categoryId, kind, description: id, amount, occurredOn }
}

const history: Transaction[] = [
  tx('o1', 'food', 100, '2026-10-05'),
  tx('o2', 'salary', 1000, '2026-10-01'),
  tx('n1', 'food', 50, '2026-11-02'),
  tx('n2', 'food', 100, '2026-11-10'),
  tx('n3', 'salary', 1200, '2026-11-01'),
  tx('n4', 'fun', 30, '2026-11-08'),
]

const budgets: Budget[] = [{ id: 'b1', categoryId: 'food', month: '2026-11', limitAmount: 400 }]

describe('insights: comparação com o mês anterior', () => {
  const today = new Date(2026, 10, 10)
  const model = buildDashboardModel('2026-11', categories, history, budgets)
  const insights = buildInsights(model, { compare: 'anterior', today })

  it('UX-21: deltas contra outubro', () => {
    expect(insights.expenseChange).toBe(80)
    expect(insights.incomeChange).toBe(20)
    expect(insights.balanceChange).toBe(120)
    expect(insights.comparisonAtSameDay).toBe(100)
  })

  it('UX-18: o ritmo tem acumulado, comparação, gasto e contagem do dia', () => {
    expect(insights.pace[9]).toMatchObject({ day: 10, current: 180, comparison: 100, dayExpense: 100, dayCount: 1 })
    expect(insights.pace[10]?.current).toBeNull()
    expect(paceDiff(insights.pace[9])).toBe(80)
    expect(paceDiff(insights.pace[10])).toBeNull()
  })

  it('projeta o gasto do mês pelo ritmo atual', () => {
    expect(insights.daysElapsed).toBe(10)
    expect(insights.dailyAverage).toBe(18)
    expect(insights.projectedExpense).toBe(540)
    expect(insights.pace[29]?.projected).toBe(540)
  })

  it('UX-33: categoria sem valor na comparação é "Nova neste mês"', () => {
    const rows = insights.expenseBreakdown.rows
    expect(rows.map((row) => row.categoryId)).toEqual(['food', 'fun'])
    expect(rows[0]).toMatchObject({ change: 50, isNew: false, diff: 50 })
    expect(rows[1]).toMatchObject({ change: null, isNew: true, diff: 30 })
  })

  it('a categoria que mais cresceu é a de maior diferença em reais', () => {
    expect(insights.topGrowth?.categoryId).toBe('food')
  })

  it('calcula quanto ainda cabe por dia nas metas', () => {
    expect(insights.remainingBudget).toBe(250)
    expect(insights.daysLeft).toBe(21)
    expect(insights.dailyAllowance).toBe(11.9)
  })

  it('sem projeção nem "cabe por dia" em mês fechado', () => {
    const closed = buildInsights(model, { today: new Date(2026, 11, 3) })
    expect(closed.daysElapsed).toBe(30)
    expect(closed.isPast).toBe(true)
    expect(closed.projectedExpense).toBeNull()
    expect(closed.dailyAllowance).toBeNull()
  })

  it('mês futuro: nenhum dia vivido', () => {
    const future = buildInsights(model, { today: new Date(2026, 9, 3) })
    expect(future.isFuture).toBe(true)
    expect(future.daysElapsed).toBe(0)
    expect(future.pace.every((point) => point.current === null)).toBe(true)
  })
})

describe('insights: média de 3 meses', () => {
  const longHistory: Transaction[] = [
    // agosto: 300 de gasto; setembro: vazio (não entra na média); outubro: 100.
    tx('a1', 'food', 300, '2026-08-31'),
    tx('a2', 'salary', 900, '2026-08-01'),
    tx('o1', 'food', 100, '2026-10-05'),
    tx('o2', 'salary', 1500, '2026-10-01'),
    tx('n1', 'food', 260, '2026-11-02'),
  ]
  const model = buildDashboardModel('2026-11', categories, longHistory, [])

  it('UX-21: usa só os meses com lançamento entre os 3 anteriores', () => {
    const comparison = buildComparison(model, 'media')
    expect(comparison?.monthKeys).toEqual(['2026-10', '2026-08'])
    expect(comparison?.expense).toBe(200)
    expect(comparison?.income).toBe(1200)
    expect(comparison?.byCategory.get('food')).toBe(200)
  })

  it('UX-21: o acumulado por dia é a média dos acumulados; dia 31 inexistente usa o último dia', () => {
    const comparison = buildComparison(model, 'media')
    // dia 5: agosto 0, outubro 100 → 50. Dia 30 (fim de nov.): agosto ainda 0 no dia 30, outubro 100 → 50.
    expect(comparison?.cumulative[4]).toBe(50)
    expect(comparison?.cumulative[29]).toBe(50)
    const insights = buildInsights(model, { compare: 'media', today: new Date(2026, 10, 10) })
    expect(insights.expenseChange).toBe(30)
  })

  it('UX-22: sem lançamento nos 3 meses anteriores, não há comparação', () => {
    const lonely = buildDashboardModel('2026-11', categories, [tx('n1', 'food', 10, '2026-11-02')], [])
    const insights = buildInsights(lonely, { compare: 'media', today: new Date(2026, 10, 10) })
    expect(insights.comparison).toBeNull()
    expect(insights.expenseChange).toBeNull()
    expect(insights.pace.every((point) => point.comparison === null)).toBe(true)
    expect(insights.expenseBreakdown.rows[0]?.isNew).toBe(false)
  })

  it('UX-22: os textos de comparação seguem o modo', () => {
    expect(comparisonCopy('anterior', '2026-11')).toMatchObject({
      name: 'Outubro',
      deltaLabel: 'vs outubro',
      emptyLabel: 'Sem outubro para comparar',
    })
    expect(comparisonCopy('media', '2026-11')).toMatchObject({
      deltaLabel: 'vs média de 3 meses',
      emptyLabel: 'Sem meses anteriores para a média',
    })
  })
})

describe('auxiliares', () => {
  it('variação percentual ignora base zero', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(10, 0)).toBeNull()
  })

  it('dias decorridos', () => {
    expect(elapsedDays('2026-11', new Date(2026, 10, 18))).toBe(18)
    expect(elapsedDays('2026-12', new Date(2026, 10, 18))).toBe(0)
    expect(elapsedDays('2026-10', new Date(2026, 10, 18))).toBe(31)
  })

  it('UX-31: agrupa a cauda em "Outras (n)" com as categorias dentro', () => {
    const rows: CategoryRow[] = Array.from({ length: 8 }, (_, index) => ({
      categoryId: `c${index}`,
      name: `C${index}`,
      color: '#2563eb',
      total: 10,
      share: 0.125,
      change: null,
      diff: null,
      isNew: false,
    }))
    const folded = foldCategories(rows, 80, 'expense')
    expect(folded.rows).toHaveLength(5)
    expect(folded.others?.name).toBe('Outras (3)')
    expect(folded.others?.total).toBe(30)
    expect(folded.others?.share).toBeCloseTo(0.375)
    expect(folded.others?.items.map((item) => item.categoryId)).toEqual(['c5', 'c6', 'c7'])
    expect(foldCategories(rows.slice(0, 6), 60, 'expense').others).toBeNull()
  })
})

describe('destaque do mês', () => {
  const categoriesHeadline: Category[] = categories
  it('UX-10 / UX-14: verbo e valor seguem o mês e o sinal do saldo', () => {
    const positive = buildDashboardModel('2026-11', categoriesHeadline, [tx('s', 'salary', 1000, '2026-11-01'), tx('a', 'food', 300, '2026-11-02')], [])
    expect(monthHeadline(positive, buildInsights(positive, { today: new Date(2026, 10, 23) }))).toEqual({
      label: 'Saldo livre do mês',
      verb: 'Sobram',
      value: 700,
      negative: false,
    })
    expect(monthHeadline(positive, buildInsights(positive, { today: new Date(2026, 11, 2) })).verb).toBe('Sobraram')
    const negative = buildDashboardModel('2026-11', categoriesHeadline, [tx('s', 'salary', 100, '2026-11-01'), tx('a', 'food', 420, '2026-11-02')], [])
    expect(monthHeadline(negative, buildInsights(negative, { today: new Date(2026, 10, 23) }))).toMatchObject({
      label: 'Saldo negativo do mês',
      verb: 'Faltam',
      value: 320,
      negative: true,
    })
  })

  it('mês sem receita, vazio e futuro', () => {
    const noIncome = buildDashboardModel('2026-11', categoriesHeadline, [tx('a', 'food', 50, '2026-11-02')], [])
    expect(monthHeadline(noIncome, buildInsights(noIncome, { today: new Date(2026, 10, 23) }))).toMatchObject({ verb: 'Já saíram', value: 50 })
    const empty = buildDashboardModel('2026-11', categoriesHeadline, [], [])
    expect(monthHeadline(empty, buildInsights(empty, { today: new Date(2026, 10, 23) }))).toMatchObject({ verb: 'Em novembro', value: 0 })
    expect(monthHeadline(empty, buildInsights(empty, { today: new Date(2026, 9, 2) })).label).toBe('Resumo do mês')
  })
})
