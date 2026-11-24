import type { Budget, Category, Transaction } from '@/domain/types'
import { buildDashboardModel, groupByMonth, historyBounds } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Alimentação', kind: 'expense', color: '#c2410c' },
  { id: 'rent', name: 'Moradia', kind: 'expense', color: '#2563eb' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#0e7490' },
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
  { id: 'b2', categoryId: 'rent', month: '2026-11', limitAmount: 90 },
]

describe('modelo do painel', () => {
  const model = buildDashboardModel('2026-11', categories, history, budgets)

  it('AC-01: isola o mês aberto e soma em centavos (receitas, gastos, saldo e poupança)', () => {
    expect(model.income).toBe(300)
    expect(model.expense).toBe(200.5)
    expect(model.balance).toBe(99.5)
    expect(model.savingsPercent).toBe(33)
    expect(model.averageExpense).toBe(66.83)
    expect(model.largestExpense?.description).toBe('Aluguel')
    expect(model.incomeCount).toBe(1)
    expect(model.expenseCount).toBe(3)
  })

  it('AC-01: soma de centavos não perde precisão com valores quebrados', () => {
    const items: Transaction[] = Array.from({ length: 10 }, (_, index) => ({
      id: `x${index}`,
      categoryId: 'food',
      kind: 'expense',
      description: 'Café',
      amount: 0.1,
      occurredOn: '2026-11-03',
    }))
    expect(buildDashboardModel('2026-11', categories, items, []).expense).toBe(1)
  })

  it('AC-10: o histórico tem 12 meses terminando no mês aberto', () => {
    expect(model.months).toHaveLength(12)
    expect(model.months[0]?.key).toBe('2025-12')
    expect(model.months.at(-1)?.key).toBe('2026-11')
    expect(model.months.at(-1)?.label).toBe('Nov')
    expect(model.months.at(-2)).toMatchObject({ key: '2026-10', expense: 999, count: 1 })
  })

  it('AC-10: historyBounds com janela de 12 começa 11 meses antes', () => {
    expect(historyBounds('2026-11', 12)).toEqual({ start: '2025-12-01', end: '2026-11-30' })
    expect(historyBounds('2026-11', 6)).toEqual({ start: '2026-06-01', end: '2026-11-30' })
    expect(historyBounds('2026-02')).toEqual({ start: '2025-03-01', end: '2026-02-28' })
  })

  it('UX-36: cada dia do mês tem gasto, receita, contagem e o maior gasto', () => {
    expect(model.days).toHaveLength(30)
    expect(model.days[1]).toMatchObject({ date: '2026-11-02', expense: 100.5, expenseCount: 2 })
    expect(model.days[1]?.topExpense?.description).toBe('Mercado')
    expect(model.days[0]).toMatchObject({ income: 300, incomeCount: 1, expense: 0, topExpense: null })
  })

  it('UX-38: metas vêm da estourada para a em dia', () => {
    expect(model.usage.map((item) => item.budget.id)).toEqual(['b2', 'b1'])
    expect(model.usage[0]?.status).toBe('over')
    expect(model.overall).toMatchObject({ limit: 190, spent: 200.5, status: 'over' })
  })

  it('UX-39: recentes são os 6 mais novos do mês, do mais recente ao mais antigo', () => {
    expect(model.recent.map((item) => item.id)).toEqual(['3', '1', '2', '4'])
  })

  it('agrupa o histórico por mês numa passada', () => {
    const byMonth = groupByMonth(history)
    expect(byMonth.get('2026-11')).toHaveLength(4)
    expect(byMonth.get('2026-10')).toHaveLength(1)
  })
})
