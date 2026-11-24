import type { Budget, Category, Transaction } from '@/domain/types'
import { buildCategoryDetail, buildDayDetail } from '@/features/painel/detail'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Mercado', kind: 'expense', color: '#c2410c' },
  { id: 'fun', name: 'Lazer', kind: 'expense', color: '#7c3aed' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#0e7490' },
]

function tx(id: string, categoryId: string, amount: number, occurredOn: string): Transaction {
  return { id, categoryId, kind: categoryId === 'salary' ? 'income' : 'expense', description: id, amount, occurredOn }
}

const history: Transaction[] = [
  tx('o1', 'food', 1000, '2026-10-05'),
  tx('n1', 'food', 600, '2026-11-02'),
  tx('n2', 'food', 640, '2026-11-12'),
  tx('n3', 'fun', 260, '2026-11-12'),
  tx('n4', 'salary', 5000, '2026-11-01'),
]
const budgets: Budget[] = [{ id: 'b1', categoryId: 'food', month: '2026-11', limitAmount: 1500 }]
const model = buildDashboardModel('2026-11', categories, history, budgets)
const insights = buildInsights(model, { today: new Date(2026, 10, 23) })

describe('folha de categoria', () => {
  it('UX-26 / AC-13: total, variação, participação, meta, barras da janela e lançamentos', () => {
    const detail = buildCategoryDetail('food', model, insights, 6)
    expect(detail).not.toBeNull()
    expect(detail?.total).toBe(1240)
    expect(detail?.change).toBe(24)
    expect(detail?.share).toBeCloseTo(1240 / 1500)
    expect(detail?.budget?.budget.id).toBe('b1')
    expect(detail?.months).toHaveLength(6)
    expect(detail?.months.at(-1)).toMatchObject({ key: '2026-11', total: 1240, isOpen: true })
    expect(detail?.months.at(-2)?.total).toBe(1000)
    expect(detail?.average).toBe(373.33)
    expect(detail?.transactions.map((item) => item.id)).toEqual(['n2', 'n1'])
    expect(detail?.dailyAllowance).toBe(32.5)
  })

  it('AC-10: com janela de 12, as barras cobrem 12 meses', () => {
    expect(buildCategoryDetail('food', model, insights, 12)?.months).toHaveLength(12)
  })

  it('UX-33: categoria sem valor na comparação é nova; receita não tem meta', () => {
    expect(buildCategoryDetail('fun', model, insights, 6)?.isNew).toBe(true)
    expect(buildCategoryDetail('salary', model, insights, 6)?.budget).toBeNull()
  })

  it('AC-15 / UX-30: id que não está nas categorias do usuário devolve null', () => {
    expect(buildCategoryDetail('3f2504e0-4f89-11d3-9a0c-0305e82c3301', model, insights, 6)).toBeNull()
  })
})

describe('folha do dia', () => {
  it('UX-16 / UX-40: lançamentos e totais do dia, contra a média por dia', () => {
    const detail = buildDayDetail('2026-11-12', model, insights)
    expect(detail).toMatchObject({ day: 12, totalDays: 30, expense: 900, income: 0, versusAverage: 'above' })
    expect(detail?.transactions.map((item) => item.id).sort()).toEqual(['n2', 'n3'])
    expect(buildDayDetail('2026-11-03', model, insights)?.versusAverage).toBe('below')
  })

  it('dia fora do mês aberto não abre', () => {
    expect(buildDayDetail('2026-10-05', model, insights)).toBeNull()
  })
})
