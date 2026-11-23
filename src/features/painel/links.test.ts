import { budgetsLink, transactionsLink } from '@/features/painel/links'
import { describe, expect, it } from 'vitest'

describe('links do painel', () => {
  it('UX-23: card Gastos leva a Lançamentos filtrado por tipo', () => {
    expect(transactionsLink('2026-11', { kind: 'expense' })).toBe('/lancamentos?mes=2026-11&tipo=gastos')
    expect(transactionsLink('2026-11', { kind: 'income' })).toBe('/lancamentos?mes=2026-11&tipo=receitas')
    expect(transactionsLink('2026-11')).toBe('/lancamentos?mes=2026-11')
  })

  it('AC-17: "Ver em Lançamentos" leva mês, tipo e categoria', () => {
    expect(transactionsLink('2026-11', { kind: 'expense', categoryId: 'abc' })).toBe(
      '/lancamentos?mes=2026-11&tipo=gastos&categoria=abc',
    )
  })

  it('UX-24: Metas leva a Orçamentos do mês, com categoria opcional', () => {
    expect(budgetsLink('2026-11')).toBe('/orcamentos?mes=2026-11')
    expect(budgetsLink('2026-11', 'abc')).toBe('/orcamentos?mes=2026-11&categoria=abc')
  })
})
