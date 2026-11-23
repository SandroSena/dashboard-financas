import type { Budget, Category, Transaction } from '@/domain/types'
import { formatBrl } from '@/domain/money'
import { buildBudgetRows, summarize } from '@/features/orcamentos/model'
import { buildCategoryDetail } from '@/features/painel/detail'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

// AC-05: "quanto resta" é calculado em centavos em todas as telas (o domínio não tem
// `subtractMoney`; a regra virou `toCents(limite) - toCents(gasto)`). Estes testes cobrem
// Orçamentos, o card de metas do painel e a folha de categoria.

const normalize = (text: string) => text.replace(/\s/g, ' ')
const restamText = (cents: number) => (cents >= 0 ? `Restam ${formatBrl(cents / 100)}` : `Passou ${formatBrl(-cents / 100)}`)

const categories: Category[] = [
  { id: 'mercado', name: 'Mercado', kind: 'expense', color: '#2563eb' },
  { id: 'salario', name: 'Salário', kind: 'income', color: '#0e7490' },
]
const budgets: Budget[] = [{ id: 'b1', categoryId: 'mercado', month: '2026-11-01', limitAmount: 100.1 }]
// 100,10 em dez parcelas de 10,01: somadas em ponto flutuante dão 100,10000000000001.
const spend = (id: string, amount: number, occurredOn: string): Transaction => ({
  id,
  categoryId: 'mercado',
  kind: 'expense',
  description: id,
  amount,
  occurredOn,
})
const transactions: Transaction[] = Array.from({ length: 10 }, (_, index) =>
  spend(`t${index + 1}`, 10.01, `2026-11-${String(index + 2).padStart(2, '0')}`),
)

describe('AC-05: limite R$ 100,10 com gasto R$ 100,10', () => {
  it('AC-05: a soma em ponto flutuante das parcelas não é 100,10 (o cenário exercita o erro)', () => {
    expect(transactions.reduce((sum, item) => sum + item.amount, 0)).not.toBe(100.1)
  })

  it('AC-05: em Orçamentos, restante é exatamente 0 e o texto é "Restam R$ 0,00"', () => {
    const [row] = buildBudgetRows(categories, budgets, transactions, { month: '2026-11-01', today: new Date(2026, 10, 23) })
    expect(row.spentCents).toBe(10010)
    expect(row.remainingCents).toBe(0)
    expect(Object.is(row.remainingCents, -0)).toBe(false)
    expect(normalize(restamText(row.remainingCents ?? NaN))).toBe('Restam R$ 0,00')
    // exatamente no limite conta como estourada (≥ 100%, spec de Orçamentos) e não sobra nada por dia
    expect(row.status).toBe('over')
    expect(row.perDayCents).toBeNull()
  })

  it('AC-05: no resumo de Orçamentos, o total restante também é 0', () => {
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11-01', today: new Date(2026, 10, 23) })
    const summary = summarize(rows, '2026-11-01', new Date(2026, 10, 23))
    expect(summary?.remainingCents).toBe(0)
    expect(summary?.perDayCents).toBeNull()
  })

  it('AC-05: no painel, o restante geral das metas é 0 e não há "cabe por dia"', () => {
    const model = buildDashboardModel('2026-11', categories, transactions, budgets)
    const insights = buildInsights(model, { today: new Date(2026, 10, 23) })
    expect(insights.remainingBudget).toBe(0)
    expect(insights.dailyAllowance).toBeNull()
  })

  it('AC-05: na folha da categoria, o restante (meta − gasto) dá "Restam R$ 0,00"', () => {
    const model = buildDashboardModel('2026-11', categories, transactions, budgets)
    const insights = buildInsights(model, { today: new Date(2026, 10, 23) })
    const detail = buildCategoryDetail('mercado', model, insights, 6)
    expect(detail?.total).toBe(100.1)
    expect(detail?.budget?.budget.limitAmount).toBe(100.1)
    expect(detail?.budget?.spent).toBe(100.1)
    expect(detail?.dailyAllowance).toBeNull()
  })

  it('AC-05: um centavo a mais vira "Passou R$ 0,01"', () => {
    const more = [...transactions, spend('t4', 0.01, '2026-11-05')]
    const [row] = buildBudgetRows(categories, budgets, more, { month: '2026-11-01', today: new Date(2026, 10, 23) })
    expect(row.remainingCents).toBe(-1)
    expect(normalize(restamText(row.remainingCents ?? NaN))).toBe('Passou R$ 0,01')
  })
})
