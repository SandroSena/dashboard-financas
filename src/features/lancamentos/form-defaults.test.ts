import type { Category, Transaction } from '@/domain/types'
import { newTransactionDefaults, pickDefaultCategory, shortcutDate } from '@/features/lancamentos/form-defaults'
import { nextRadioIndex } from '@/shared/lib/roving'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'mercado', name: 'Mercado', kind: 'expense', color: '#2563eb' },
  { id: 'casa', name: 'Casa', kind: 'expense', color: '#7c3aed' },
  { id: 'salario', name: 'Salário', kind: 'income', color: '#0e7490' },
]
const recent: Transaction[] = [
  { id: '1', categoryId: 'salario', kind: 'income', description: 'Salário', amount: 1, occurredOn: '2026-11-05' },
  { id: '2', categoryId: 'casa', kind: 'expense', description: 'Luz', amount: 1, occurredOn: '2026-11-04' },
]
const today = new Date(2026, 10, 23)

describe('diálogo de lançamento: valores iniciais', () => {
  it('UX-55: a última categoria usada no tipo vem marcada; sem ela, a do lançamento mais recente', () => {
    expect(pickDefaultCategory('expense', categories, 'mercado', recent)).toBe('mercado')
    expect(pickDefaultCategory('expense', categories, undefined, recent)).toBe('casa')
    expect(pickDefaultCategory('income', categories, 'mercado', recent)).toBe('salario')
    expect(pickDefaultCategory('expense', categories, 'excluida', [])).toBe('')
  })

  it('defaultDate do painel vence; inválida cai em hoje (mês atual) ou dia 1', () => {
    const memory = { lastUsed: {}, recent: [] }
    expect(newTransactionDefaults('2026-11', categories, { occurredOn: '2026-11-12' }, memory, today).occurredOn).toBe('2026-11-12')
    expect(newTransactionDefaults('2026-11', categories, { occurredOn: '2026-02-31' }, memory, today).occurredOn).toBe('2026-11-23')
    expect(newTransactionDefaults('2026-09', categories, {}, memory, today).occurredOn).toBe('2026-09-01')
  })

  it('categoria pré-preenchida define o tipo; kind sozinho escolhe o padrão daquele tipo', () => {
    const memory = { lastUsed: {}, recent }
    expect(newTransactionDefaults('2026-11', categories, { categoryId: 'salario', kind: 'expense' }, memory, today)).toMatchObject({
      kind: 'income',
      categoryId: 'salario',
    })
    expect(newTransactionDefaults('2026-11', categories, { kind: 'income' }, memory, today).categoryId).toBe('salario')
  })

  it('atalhos Hoje e Ontem, inclusive na virada do mês', () => {
    expect(shortcutDate('today', today)).toBe('2026-11-23')
    expect(shortcutDate('yesterday', new Date(2026, 11, 1))).toBe('2026-11-30')
  })
})

describe('chips de categoria: foco itinerante', () => {
  it('AC-20: setas andam e dão a volta; Home/End vão às pontas; outras teclas não navegam', () => {
    expect(nextRadioIndex(0, 'ArrowRight', 3)).toBe(1)
    expect(nextRadioIndex(2, 'ArrowRight', 3)).toBe(0)
    expect(nextRadioIndex(0, 'ArrowLeft', 3)).toBe(2)
    expect(nextRadioIndex(1, 'ArrowUp', 3)).toBe(0)
    expect(nextRadioIndex(1, 'End', 3)).toBe(2)
    expect(nextRadioIndex(1, 'Home', 3)).toBe(0)
    expect(nextRadioIndex(1, 'Tab', 3)).toBeNull()
    expect(nextRadioIndex(0, 'ArrowRight', 0)).toBeNull()
  })
})
