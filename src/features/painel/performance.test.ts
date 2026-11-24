import type { Budget, Category, Transaction } from '@/domain/types'
import { buildCalendar } from '@/features/painel/calendar'
import { buildCategoryDetail } from '@/features/painel/detail'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { toCents } from '@/domain/money'
import { describe, expect, it } from 'vitest'

/** Gerador determinístico (sem Math.random, para o teste não oscilar). */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('desempenho do modelo', () => {
  const random = seeded(42)
  const categories: Category[] = Array.from({ length: 15 }, (_, index) => ({
    id: `c${index}`,
    name: `Categoria ${index}`,
    kind: index < 3 ? 'income' : 'expense',
    color: '#2563eb',
  }))
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2025, 11 + index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
  const history: Transaction[] = Array.from({ length: 3000 }, (_, index) => {
    const category = categories[Math.floor(random() * categories.length)]
    const month = months[Math.floor(random() * months.length)]
    const day = 1 + Math.floor(random() * 28)
    return {
      id: `t${index}`,
      categoryId: category.id,
      kind: category.kind,
      description: `Lançamento ${index}`,
      amount: Math.round(random() * 50000) / 100,
      occurredOn: `${month}-${String(day).padStart(2, '0')}`,
    }
  })
  const budgets: Budget[] = categories
    .filter((category) => category.kind === 'expense')
    .map((category, index) => ({ id: `b${index}`, categoryId: category.id, month: '2026-11', limitAmount: 1500 }))

  it('AC-29: 3.000 lançamentos em 12 meses e 15 categorias montam modelo + insights em menos de 100 ms', () => {
    // Aquecimento do JIT, como no navegador depois da primeira troca de mês.
    buildInsights(buildDashboardModel('2026-11', categories, history, budgets), { compare: 'media' })
    const start = performance.now()
    const model = buildDashboardModel('2026-11', categories, history, budgets)
    const insights = buildInsights(model, { compare: 'media', today: new Date(2026, 10, 23) })
    buildCalendar(model, insights)
    buildCategoryDetail('c5', model, insights, 12)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  it('AC-01: os totais do mês batem com a soma em centavos de todos os lançamentos', () => {
    const model = buildDashboardModel('2026-11', categories, history, budgets)
    const inMonth = history.filter((item) => item.occurredOn.startsWith('2026-11-'))
    const expected = (kind: 'income' | 'expense') =>
      inMonth.filter((item) => item.kind === kind).reduce((sum, item) => sum + toCents(item.amount), 0) / 100
    expect(model.income).toBe(expected('income'))
    expect(model.expense).toBe(expected('expense'))
    expect(model.months.reduce((sum, point) => sum + point.count, 0)).toBe(3000)
  })
})
