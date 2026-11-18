import {
  balanceOf,
  budgetStatus,
  budgetUsage,
  expensesByCategory,
  expensesByDay,
  overallBudget,
  spentByCategory,
  totalByKind,
} from '@/domain/summary'
import type { Budget, Category, Transaction } from '@/domain/types'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Alimentação', kind: 'expense', color: '#f97316' },
  { id: 'rent', name: 'Moradia', kind: 'expense', color: '#6366f1' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#16a34a' },
]

const transactions: Transaction[] = [
  { id: '1', categoryId: 'food', kind: 'expense', description: 'Mercado', amount: 80, occurredOn: '2026-11-02' },
  { id: '2', categoryId: 'food', kind: 'expense', description: 'Padaria', amount: 20.5, occurredOn: '2026-11-02' },
  { id: '3', categoryId: 'rent', kind: 'expense', description: 'Aluguel', amount: 100, occurredOn: '2026-11-05' },
  { id: '4', categoryId: 'salary', kind: 'income', description: 'Salário', amount: 300, occurredOn: '2026-11-01' },
  { id: '5', categoryId: 'food', kind: 'expense', description: 'Fora do mês', amount: 999, occurredOn: '2026-10-31' },
]

const budgets: Budget[] = [
  { id: 'b1', categoryId: 'food', month: '2026-11-01', limitAmount: 100 },
  { id: 'b2', categoryId: 'rent', month: '2026-11-01', limitAmount: 200 },
]

describe('resumo do mês', () => {
  it('soma receitas, gastos e saldo em centavos', () => {
    expect(totalByKind(transactions, 'expense')).toBe(1199.5)
    expect(totalByKind(transactions, 'income')).toBe(300)
    expect(balanceOf(transactions)).toBe(-899.5)
  })

  it('agrupa gastos por categoria e ignora receitas', () => {
    expect(expensesByCategory(transactions, categories)).toEqual([
      { categoryId: 'food', name: 'Alimentação', color: '#f97316', total: 1099.5 },
      { categoryId: 'rent', name: 'Moradia', color: '#6366f1', total: 100 },
    ])
  })

  it('preenche todos os dias do mês e ignora outro mês e receitas', () => {
    const days = expensesByDay(transactions, '2026-11')
    expect(days).toHaveLength(30)
    expect(days[0]).toEqual({ date: '2026-11-01', day: 1, total: 0 })
    expect(days[1]).toEqual({ date: '2026-11-02', day: 2, total: 100.5 })
    expect(days[4]).toEqual({ date: '2026-11-05', day: 5, total: 100 })
    expect(days.every((day) => day.date.startsWith('2026-11-'))).toBe(true)
  })

  it('classifica a meta como dentro, perto do limite ou estourada', () => {
    expect(budgetStatus(0, 100).status).toBe('ok')
    expect(budgetStatus(79.99, 100).status).toBe('ok')
    expect(budgetStatus(80, 100)).toMatchObject({ status: 'warning', percent: 80 })
    expect(budgetStatus(100, 100).status).toBe('over')
    expect(budgetStatus(120, 100)).toMatchObject({ status: 'over', percent: 120 })
  })

  it('calcula o uso de cada meta e o total das metas definidas', () => {
    const monthTransactions = transactions.filter((item) => item.occurredOn.startsWith('2026-11-'))
    expect(spentByCategory(monthTransactions, 'food')).toBe(100.5)

    const usage = budgetUsage(budgets, monthTransactions, categories)
    expect(usage[0]).toMatchObject({ categoryName: 'Alimentação', spent: 100.5, status: 'over' })
    expect(usage[1]).toMatchObject({ categoryName: 'Moradia', spent: 100, status: 'ok' })

    const overall = overallBudget(usage)
    expect(overall.limit).toBe(300)
    expect(overall.spent).toBe(200.5)
    expect(overall.status).toBe('ok')
    expect(overallBudget([])).toEqual({ limit: 0, spent: 0, ratio: 0, percent: 0, status: 'ok' })
  })
})
