import type { Category, Transaction } from '@/domain/types'
import { buildComparison, buildInsights, comparisonCopy } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

// AC-12 da auditoria pedia "média dos 5 meses anteriores, meses sem movimento entram como zero".
// A spec do painel (docs/design/telas/painel.md, seção de comparação, confirmada na revisão) trocou
// a regra por UX-21/UX-22: média dos até 3 meses anteriores QUE TÊM lançamento. Estes testes
// verificam a regra em vigor, com a janela de 6 meses, e registram a divergência (ver relatório de QA).

const categories: Category[] = [
  { id: 'food', name: 'Mercado', kind: 'expense', color: '#c2410c' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#0e7490' },
]
const tx = (id: string, categoryId: string, amount: number, occurredOn: string): Transaction => ({
  id,
  categoryId,
  kind: categoryId === 'salary' ? 'income' : 'expense',
  description: id,
  amount,
  occurredOn,
})

describe('AC-12 (redefinido por UX-21/UX-22): comparar com a média e janela de 6 meses', () => {
  // junho e julho têm gasto, mas ficam fora dos 3 meses anteriores; setembro não tem nada.
  const history: Transaction[] = [
    tx('jun', 'food', 900, '2026-06-10'),
    tx('jul', 'food', 900, '2026-07-10'),
    tx('ago', 'food', 300, '2026-08-10'),
    tx('out', 'food', 100, '2026-10-10'),
    tx('nov', 'food', 400, '2026-11-10'),
  ]
  const model = buildDashboardModel('2026-11', categories, history, [])

  it('AC-12: a média usa só ago. e out. (meses com lançamento entre os 3 anteriores), não 5 meses com zero', () => {
    const comparison = buildComparison(model, 'media')
    expect(comparison?.monthKeys).toEqual(['2026-10', '2026-08'])
    expect(comparison?.expense).toBe(200)
    const insights = buildInsights(model, { compare: 'media', today: new Date(2026, 10, 23) })
    expect(insights.expenseChange).toBe(100)
  })

  it('AC-12: sem mês anterior com movimento, a variação é null e o texto é o de "sem meses para a média"', () => {
    const lonely = buildDashboardModel('2026-11', categories, [tx('nov', 'food', 400, '2026-11-10')], [])
    const insights = buildInsights(lonely, { compare: 'media', today: new Date(2026, 10, 23) })
    expect(insights.comparison).toBeNull()
    expect(insights.expenseChange).toBeNull()
    expect(insights.incomeChange).toBeNull()
    expect(insights.balanceChange).toBeNull()
    expect(comparisonCopy('media', '2026-11').emptyLabel).toBe('Sem meses anteriores para a média')
  })

  it('AC-12: mês com só receita conta como mês com lançamento (gasto zero entra na média)', () => {
    const withIncomeOnly = buildDashboardModel(
      '2026-11',
      categories,
      [tx('out', 'food', 300, '2026-10-10'), tx('set', 'salary', 1000, '2026-09-01'), tx('nov', 'food', 150, '2026-11-10')],
      [],
    )
    const comparison = buildComparison(withIncomeOnly, 'media')
    expect(comparison?.monthKeys).toEqual(['2026-10', '2026-09'])
    expect(comparison?.expense).toBe(150)
    expect(comparison?.income).toBe(500)
  })

  it('AC-12: no acumulado por dia, o dia que não existe num mês curto usa o último dia desse mês', () => {
    // março tem 31 dias; fevereiro (28) e janeiro com gasto; dezembro vazio fica fora.
    const march = buildDashboardModel(
      '2026-03',
      categories,
      [tx('jan', 'food', 90, '2026-01-31'), tx('fev', 'food', 60, '2026-02-28'), tx('mar', 'food', 10, '2026-03-05')],
      [],
    )
    const comparison = buildComparison(march, 'media')
    expect(comparison?.monthKeys).toEqual(['2026-02', '2026-01'])
    // dia 29 a 31: fevereiro repete o dia 28 (60), janeiro tem 0 até o dia 30 e 90 no dia 31.
    expect(comparison?.cumulative[27]).toBe(30)
    expect(comparison?.cumulative[29]).toBe(30)
    expect(comparison?.cumulative[30]).toBe(75)
  })
})
