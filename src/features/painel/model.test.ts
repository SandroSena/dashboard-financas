import type { Budget, Category, Transaction } from '@/domain/types'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Alimentação', kind: 'expense', color: '#f97316' },
  { id: 'rent', name: 'Moradia', kind: 'expense', color: '#6366f1' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#16a34a' },
]

const history: Transaction[] = [
  { id: '1', categoryId: 'food', kind: 'expense', description: 'Mercado', amount: 80, occurredOn: '2026-11-02' },
  { id: '2', categoryId: 'food', kind: 'expense', description: 'Padaria', amount: 20.5, occurredOn: '2026-11-02' },
  { id: '3', categoryId: 'rent', kind: 'expense', description: 'Aluguel', amount: 100, occurredOn: '2026-11-05' },
  { id: '4', categoryId: 'salary', kind: 'income', description: 'Salário', amount: 300, occurredOn: '2026-11-01' },
  { id: '5', categoryId: 'food', kind: 'expense', description: 'Fora do mês', amount: 999, occurredOn: '2026-10-20' },
]

const budgets: Budget[] = [
  { id: 'b1', categoryId: 'food', month: '2026-11', limitAmount: 100 },
  { id: 'b2', categoryId: 'rent', month: '2026-11', limitAmount: 200 },
]

describe('modelo dos layouts', () => {
  const model = buildDashboardModel('2026-11', categories, history, budgets)

  it('isola o mês escolhido e calcula a poupança', () => {
    expect(model.income).toBe(300)
    expect(model.expense).toBe(200.5)
    expect(model.balance).toBe(99.5)
    expect(model.savingsPercent).toBe(33)
    expect(model.averageExpense).toBe(66.83)
    expect(model.largestExpense?.description).toBe('Aluguel')
  })

  it('monta seis meses e guarda o gasto de outubro na tendência', () => {
    expect(model.months).toHaveLength(6)
    expect(model.months[0]?.key).toBe('2026-06')
    expect(model.months[5]?.label).toBe('Nov')
    expect(model.months[4]?.expense).toBe(999)
    expect(model.stackSeries.map((series) => series.name)).toContain('Alimentação')
    const october = model.stackPoints[4]
    expect(october?.food).toBe(999)
  })

  it('acumula o fluxo e marca o calendário', () => {
    expect(model.flow[0]).toMatchObject({ day: 1, income: 300, expense: 0, balance: 300 })
    expect(model.flow[1]).toMatchObject({ day: 2, expense: 100.5, balance: 199.5 })
    expect(model.flow.at(-1)?.balance).toBe(99.5)
    expect(model.calendarOffset).toBe(0)
    expect(model.calendar[1]?.total).toBe(100.5)
    expect(model.weekdays[1]?.expense).toBe(100.5)
    expect(model.scatter).toHaveLength(3)
  })
})
