import type { Budget, Category, Transaction } from '@/domain/types'
import {
  buildBudgetRows,
  checkDraft,
  copyPlan,
  copyResultText,
  daysLeft,
  emptyFilterText,
  filterRows,
  meterValueText,
  perDayCents,
  statusCounts,
  summarize,
  syncDraft,
  threeMonthAverages,
} from '@/features/orcamentos/model'
import { describe, expect, it } from 'vitest'

const cat = (id: string, name: string, kind: Category['kind'] = 'expense'): Category => ({ id, name, kind, color: '#2563eb' })
const budget = (categoryId: string, limitAmount: number, month = '2026-11-01'): Budget => ({
  id: `b-${categoryId}-${month}`,
  categoryId,
  month,
  limitAmount,
})
const spend = (categoryId: string, amount: number, occurredOn = '2026-11-10'): Transaction => ({
  id: `${categoryId}-${occurredOn}-${amount}`,
  categoryId,
  kind: 'expense',
  description: 'x',
  amount,
  occurredOn,
})

const categories = [cat('mercado', 'Mercado'), cat('lazer', 'Lazer'), cat('casa', 'Casa'), cat('agua', 'Água'), cat('salario', 'Salário', 'income')]
const budgets = [budget('mercado', 1500), budget('lazer', 500), budget('casa', 1000)]
const transactions = [spend('mercado', 1000), spend('lazer', 600), spend('casa', 850)]
const today = new Date(2026, 10, 23)

describe('orçamentos: linhas', () => {
  it('UX-81: meta de R$ 500 com gasto de R$ 600 fica estourada, passou R$ 100,00 e vem primeiro', () => {
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', today })
    expect(rows.map((row) => row.category.id)).toEqual(['lazer', 'casa', 'mercado', 'agua'])
    expect(rows[0]).toMatchObject({ status: 'over', percent: 120, remainingCents: -10000 })
    expect(meterValueText(120, 'over')).toBe('120% da meta, estourada')
    expect(meterValueText(83, 'ok')).toBe('83% da meta, em dia')
  })

  it('alerta a partir de 80%; categorias de receita ficam de fora', () => {
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', today })
    expect(rows.find((row) => row.category.id === 'casa')?.status).toBe('warning')
    expect(rows.some((row) => row.category.id === 'salario')).toBe(false)
  })

  it('"Cabem R$ X/dia" só no mês atual e se ainda resta', () => {
    expect(daysLeft('2026-11', today)).toBe(8)
    expect(daysLeft('2026-10', today)).toBeNull()
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', today })
    expect(rows.find((row) => row.category.id === 'mercado')?.perDayCents).toBe(Math.floor(50000 / 8))
    expect(rows.find((row) => row.category.id === 'lazer')?.perDayCents).toBeNull()
    expect(perDayCents(1000, null)).toBeNull()
  })

  it('UX-87: filtro por situação, contagens e texto do vazio', () => {
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', today })
    expect(statusCounts(rows)).toEqual({ todas: 4, estouradas: 1, alerta: 1, 'em-dia': 1 })
    expect(filterRows(rows, 'alerta').map((row) => row.category.id)).toEqual(['casa'])
    expect(filterRows(rows.filter((row) => row.status !== 'warning'), 'alerta')).toEqual([])
    expect(emptyFilterText('alerta', '2026-11')).toBe('Nenhuma meta em alerta em novembro.')
  })
})

describe('orçamentos: resumo', () => {
  it('UX-80: total das metas, já saiu com %, ainda cabe e por dia no mês atual', () => {
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', today })
    expect(summarize(rows, '2026-11', today)).toEqual({
      limitCents: 300000,
      spentCents: 245000,
      percent: 82,
      status: 'warning',
      remainingCents: 55000,
      perDayCents: Math.floor(55000 / 8),
    })
    expect(summarize(rows, '2026-10', today)?.perDayCents).toBeNull()
  })

  it('mês sem metas: sem resumo (a tela mostra a faixa "Nenhuma meta em ...")', () => {
    expect(summarize(buildBudgetRows(categories, [], transactions, { month: '2026-11' }), '2026-11')).toBeNull()
  })
})

describe('orçamentos: campo da meta', () => {
  it('UX-82: "abc" é inválido; vazio remove; valor com vírgula é aceito', () => {
    expect(checkDraft('abc')).toEqual({ kind: 'invalid' })
    expect(checkDraft('0')).toEqual({ kind: 'invalid' })
    expect(checkDraft('1,234')).toEqual({ kind: 'invalid' })
    expect(checkDraft('   ')).toEqual({ kind: 'empty' })
    expect(checkDraft('1.500,50')).toEqual({ kind: 'valid', amount: 1500.5 })
  })
})

describe('orçamentos: sugestão e cópia', () => {
  it('UX-85: média de 3 meses só com gasto em cada um dos 3 meses anteriores', () => {
    const history = [
      spend('agua', 100, '2026-08-05'),
      spend('agua', 120, '2026-09-05'),
      spend('agua', 80.01, '2026-10-05'),
      spend('lazer', 300, '2026-10-05'),
      spend('agua', 999, '2026-07-05'),
    ]
    const averages = threeMonthAverages(history, '2026-11')
    expect(averages.get('agua')).toBe(Math.round(30001 / 3))
    expect(averages.has('lazer')).toBe(false)
    const rows = buildBudgetRows(categories, budgets, transactions, { month: '2026-11', history })
    expect(rows.find((row) => row.category.id === 'agua')?.suggestionCents).toBe(10000)
    expect(rows.find((row) => row.category.id === 'mercado')?.suggestionCents).toBeNull()
  })

  it('UX-84: copia as 6 metas de outubro, sem repetir as que já existem nem categorias excluídas', () => {
    const october = ['mercado', 'lazer', 'casa', 'agua', 'excluida', 'salario'].map((id) => budget(id, 100, '2026-10-01'))
    expect(copyPlan(october, [], categories).map((item) => item.categoryId)).toEqual(['mercado', 'lazer', 'casa', 'agua'])
    expect(copyPlan(october, [budget('mercado', 1)], categories)).toHaveLength(3)
    expect(copyResultText(6, 6, '2026-10')).toBe('6 metas copiadas de outubro.')
    expect(copyResultText(1, 1, '2026-10')).toBe('1 meta copiada de outubro.')
    expect(copyResultText(4, 6, '2026-10')).toBe('4 de 6 metas copiadas. Tentem de novo para as que faltaram.')
  })
})

describe('syncDraft: rascunho acompanha o valor salvo sem remontar a linha', () => {
  it('campo limpo passa a mostrar o novo valor salvo', () => {
    expect(syncDraft('500,00', '500,00', '650,00')).toBe('650,00')
    expect(syncDraft('', '', '300,00')).toBe('300,00')
  })

  it('depois de salvar com Enter, "500" vira "500,00" (mesmo valor, formato do salvo)', () => {
    expect(syncDraft('500', '', '500,00')).toBe('500,00')
    expect(syncDraft('1.500,5', '1.200,00', '1.500,50')).toBe('1.500,50')
  })

  it('meta removida: campo vazio continua vazio', () => {
    expect(syncDraft('', '400,00', '')).toBe('')
  })

  it('edição em andamento com outro valor fica como está', () => {
    expect(syncDraft('700', '500,00', '650,00')).toBe('700')
    expect(syncDraft('abc', '500,00', '650,00')).toBe('abc')
  })
})
