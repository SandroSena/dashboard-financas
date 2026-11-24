import type { Category, Transaction } from '@/domain/types'
import {
  changeKind,
  checkCategoryFilter,
  countLabel,
  dayHeading,
  EMPTY_FILTERS,
  filterTransactions,
  groupByDay,
  hasActiveFilters,
  needsCanonicalUrl,
  normalizeSearch,
  otherMonthOf,
  readFilters,
  rowEditLabel,
  totalsOf,
  writeFilters,
} from '@/features/lancamentos/filters'
import { describe, expect, it } from 'vitest'

const MERCADO = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
const SALARIO = '3f2504e0-4f89-11d3-9a0c-0305e82c3302'
const categories: Category[] = [
  { id: MERCADO, name: 'Mercado', kind: 'expense', color: '#2563eb' },
  { id: SALARIO, name: 'Salário', kind: 'income', color: '#0e7490' },
]

function tx(id: string, partial: Partial<Transaction>): Transaction {
  return { id, categoryId: MERCADO, kind: 'expense', description: 'Pão de Açúcar', amount: 10, occurredOn: '2026-11-12', ...partial }
}

const list: Transaction[] = [
  tx('1', { description: 'Farmácia São João', amount: 42.5, occurredOn: '2026-11-13' }),
  tx('2', { description: 'Pão de Açúcar', amount: 86, occurredOn: '2026-11-12' }),
  tx('3', { kind: 'income', categoryId: SALARIO, description: 'Salário', amount: 8000, occurredOn: '2026-11-12' }),
  tx('4', { description: 'FARMÁCIA popular', amount: 0.1, occurredOn: '2026-11-10' }),
]

describe('lançamentos: filtros na URL', () => {
  it('UX-50: ?mes=2026-11&tipo=gastos filtra só gastos', () => {
    const filters = readFilters(new URLSearchParams('mes=2026-11&tipo=gastos'))
    expect(filters).toEqual({ tipo: 'gastos', categoria: null, busca: '' })
    expect(filterTransactions(list, filters).every((item) => item.kind === 'expense')).toBe(true)
  })

  it('UX-51: categoria=<id> da URL filtra só aquela categoria', () => {
    const filters = readFilters(new URLSearchParams(`categoria=${MERCADO.toUpperCase()}`))
    expect(filters.categoria).toBe(MERCADO)
    expect(filterTransactions(list, filters).map((item) => item.id)).toEqual(['1', '2', '4'])
  })

  it('AC-17: tipo, categoria ou busca inválidos caem no padrão sem quebrar', () => {
    for (const query of ['tipo=xyz', 'tipo=', 'categoria=abc', "categoria=1' or '1'='1", 'busca=%20%20']) {
      expect(readFilters(new URLSearchParams(query))).toEqual(EMPTY_FILTERS)
    }
  })

  it('AC-17: tipo=expense/income (formato da auditoria) é aceito e reescrito como gastos/receitas', () => {
    const params = new URLSearchParams('mes=2026-11&tipo=expense')
    expect(readFilters(params).tipo).toBe('gastos')
    expect(needsCanonicalUrl(params)).toBe(true)
    expect(writeFilters(params, readFilters(params)).toString()).toBe('mes=2026-11&tipo=gastos')
    expect(needsCanonicalUrl(new URLSearchParams('mes=2026-11&tipo=receitas'))).toBe(false)
  })

  it('UX-52: limpar os filtros deixa a URL só com mes', () => {
    const params = new URLSearchParams(`mes=2026-11&tipo=gastos&categoria=${MERCADO}&busca=farm`)
    expect(writeFilters(params, EMPTY_FILTERS).toString()).toBe('mes=2026-11')
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters(readFilters(params))).toBe(true)
  })

  it('busca muito longa é cortada em 80 caracteres', () => {
    const params = new URLSearchParams({ busca: 'a'.repeat(200) })
    expect(readFilters(params).busca).toHaveLength(80)
  })
})

describe('lançamentos: categoria da URL', () => {
  it('AC-15: categoria inexistente (ou de outra conta) sai do filtro', () => {
    const result = checkCategoryFilter({ ...EMPTY_FILTERS, categoria: '3f2504e0-4f89-11d3-9a0c-0305e82c3399' }, categories)
    expect(result.status).toBe('missing')
    expect(result.filters.categoria).toBeNull()
  })

  it('categoria de outro tipo que o da URL: o tipo passa a ser o da categoria', () => {
    const result = checkCategoryFilter({ tipo: 'receitas', categoria: MERCADO, busca: '' }, categories)
    expect(result).toEqual({ status: 'kind-adjusted', filters: { tipo: 'gastos', categoria: MERCADO, busca: '' } })
    expect(checkCategoryFilter({ tipo: 'gastos', categoria: MERCADO, busca: '' }, categories).status).toBe('ok')
  })

  it('trocar o tipo limpa a categoria que não é do novo tipo', () => {
    const current = { tipo: 'gastos' as const, categoria: MERCADO, busca: 'x' }
    expect(changeKind(current, 'receitas', categories)).toEqual({ tipo: 'receitas', categoria: null, busca: 'x' })
    expect(changeKind(current, 'todos', categories).categoria).toBe(MERCADO)
  })
})

describe('lançamentos: busca, totais e agrupamento', () => {
  it('UX-53: "farm" acha descrições sem diferenciar acento e maiúscula', () => {
    expect(normalizeSearch('  FARMÁCIA ')).toBe('farmacia')
    const result = filterTransactions(list, { ...EMPTY_FILTERS, busca: 'farm' })
    expect(result.map((item) => item.id)).toEqual(['1', '4'])
    expect(filterTransactions(list, { ...EMPTY_FILTERS, busca: 'acucar' }).map((item) => item.id)).toEqual(['2'])
  })

  it('UX-54: filtros sem resultado devolvem lista vazia', () => {
    expect(filterTransactions(list, { tipo: 'receitas', categoria: null, busca: 'farm' })).toEqual([])
  })

  it('totais somados em centavos, sem erro de ponto flutuante', () => {
    expect(totalsOf([tx('a', { amount: 0.1 }), tx('b', { amount: 0.2 })]).expenseCents).toBe(30)
    expect(totalsOf(list)).toEqual({ expenseCents: 12860, incomeCents: 800000, balanceCents: 787140 })
  })

  it('agrupa por dia na ordem recebida, com o saldo do dia em centavos', () => {
    const groups = groupByDay(list)
    expect(groups.map((group) => group.date)).toEqual(['2026-11-13', '2026-11-12', '2026-11-10'])
    expect(groups[1].netCents).toBe(800000 - 8600)
    expect(groups[0].netCents).toBe(-4250)
  })

  it('cabeçalho do dia: Hoje, Ontem e "qui., 12 nov."', () => {
    const today = new Date(2026, 10, 23)
    expect(dayHeading('2026-11-23', today)).toBe('Hoje')
    expect(dayHeading('2026-11-22', today)).toBe('Ontem')
    expect(dayHeading('2026-11-12', today)).toBe('qui., 12 nov.')
    expect(dayHeading('2026-12-01', new Date(2026, 11, 2))).toBe('Ontem')
  })

  it('contagem no singular e no plural', () => {
    expect(countLabel(1)).toBe('1 lançamento na lista')
    expect(countLabel(45)).toBe('45 lançamentos na lista')
  })

  it('UX-59: rótulo da linha no celular resume descrição, categoria, valor e data', () => {
    expect(rowEditLabel(list[1], 'Mercado')).toBe('Editar Pão de Açúcar, Mercado, − R$ 86,00, 12 de nov.')
  })

  it('UX-57: data de outro mês devolve o mês dela; do mesmo mês, null', () => {
    expect(otherMonthOf('2026-10-30', '2026-11')).toBe('2026-10')
    expect(otherMonthOf('2026-11-01', '2026-11')).toBeNull()
  })
})
