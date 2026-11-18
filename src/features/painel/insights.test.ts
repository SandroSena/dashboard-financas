import type { Budget, Category, Transaction } from '@/domain/types'
import { buildInsights, elapsedDays, foldCategories, percentChange } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Alimentação', kind: 'expense', color: '#f97316' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#16a34a' },
]

const history: Transaction[] = [
  { id: 'o1', categoryId: 'food', kind: 'expense', description: 'Mercado', amount: 100, occurredOn: '2026-10-05' },
  { id: 'o2', categoryId: 'salary', kind: 'income', description: 'Salário', amount: 1000, occurredOn: '2026-10-01' },
  { id: 'n1', categoryId: 'food', kind: 'expense', description: 'Mercado', amount: 50, occurredOn: '2026-11-02' },
  { id: 'n2', categoryId: 'food', kind: 'expense', description: 'Feira', amount: 100, occurredOn: '2026-11-10' },
  { id: 'n3', categoryId: 'salary', kind: 'income', description: 'Salário', amount: 1200, occurredOn: '2026-11-01' },
]

const budgets: Budget[] = [{ id: 'b1', categoryId: 'food', month: '2026-11', limitAmount: 400 }]

describe('insights do painel', () => {
  const today = new Date(2026, 10, 10)
  const model = buildDashboardModel('2026-11', categories, history, budgets)
  const insights = buildInsights(model, history, today)

  it('compara com o mês anterior', () => {
    expect(insights.expenseChange).toBe(50)
    expect(insights.incomeChange).toBe(20)
    expect(insights.balanceChange).toBe(150)
    expect(insights.previousAtSameDay).toBe(100)
  })

  it('projeta o gasto do mês pelo ritmo atual', () => {
    expect(insights.daysElapsed).toBe(10)
    expect(insights.dailyAverage).toBe(15)
    expect(insights.projectedExpense).toBe(450)
    expect(insights.pace[9]).toMatchObject({ day: 10, current: 150, previous: 100, projected: 150 })
    expect(insights.pace[10]?.current).toBeNull()
    expect(insights.pace[29]?.projected).toBe(450)
  })

  it('calcula quanto ainda cabe por dia na meta', () => {
    expect(insights.remainingBudget).toBe(250)
    expect(insights.dailyAllowance).toBe(11.9)
  })

  it('sem projeção em mês fechado', () => {
    const closed = buildInsights(model, history, new Date(2026, 11, 3))
    expect(closed.daysElapsed).toBe(30)
    expect(closed.projectedExpense).toBeNull()
    expect(closed.dailyAllowance).toBeNull()
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
  })

  it('agrupa a cauda em outras', () => {
    const slices = Array.from({ length: 8 }, (_, index) => ({
      categoryId: `c${index}`,
      name: `C${index}`,
      color: '#000',
      total: 10,
    }))
    const folded = foldCategories(slices, 80)
    expect(folded).toHaveLength(6)
    expect(folded.at(-1)?.total).toBe(30)
    expect(folded.at(-1)?.share).toBeCloseTo(0.375)
  })
})
