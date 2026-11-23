import type { Category, Transaction } from '@/domain/types'
import { DataError, toDataError } from '@/shared/lib/supabase'
import {
  blockedDeleteText,
  categoryMonthStats,
  categoryTabParam,
  categoryTransactionsHref,
  isDuplicateNameError,
  isInUseError,
  monthStatLines,
  nameCounter,
  sortByMonthTotal,
  tabAriaLabel,
} from '@/features/categorias/model'
import { categorySlot, CATEGORY_SLOTS, isPaletteColor } from '@/shared/lib/category-colors'
import { readFilters } from '@/features/lancamentos/filters'
import { describe, expect, it } from 'vitest'

const cat = (id: string, name: string): Category => ({ id, name, kind: 'expense', color: '#2563eb' })
const tx = (categoryId: string, amount: number): Transaction => ({
  id: `${categoryId}-${amount}`,
  categoryId,
  kind: 'expense',
  description: 'x',
  amount,
  occurredOn: '2026-11-10',
})

describe('categorias: cards do mês', () => {
  it('UX-70: total e contagem do mês, do maior para o menor; empate por nome', () => {
    const categories = [cat('a', 'Transporte'), cat('b', 'Mercado'), cat('c', 'Casa'), cat('d', 'Água')]
    const stats = categoryMonthStats([tx('b', 1000), tx('b', 240.1), tx('a', 300), tx('c', 300)])
    expect(stats.get('b')).toEqual({ totalCents: 124010, count: 2 })
    expect(sortByMonthTotal(categories, stats).map((item) => item.name)).toEqual(['Mercado', 'Casa', 'Transporte', 'Água'])
  })

  it('UX-70: textos do card, com "Nada em novembro" quando zero', () => {
    expect(monthStatLines({ totalCents: 124000, count: 9 }, '2026-11')).toEqual({
      total: 'R$ 1.240,00 em nov.',
      count: '9 lançamentos',
    })
    expect(monthStatLines({ totalCents: 5000, count: 1 }, '2026-05').count).toBe('1 lançamento')
    expect(monthStatLines(undefined, '2026-11')).toEqual({ total: 'Nada em novembro', count: null })
  })

  it('aba na URL só aceita gastos|receitas; rótulo da aba com contagem', () => {
    expect(categoryTabParam('receitas')).toBe('receitas')
    expect(categoryTabParam('income')).toBeNull()
    expect(tabAriaLabel('gastos', 9)).toBe('Gastos, 9 categorias')
    expect(tabAriaLabel('receitas', 1)).toBe('Receitas, 1 categoria')
  })

  it('contador do nome só a partir de 30 caracteres', () => {
    expect(nameCounter(29)).toBeNull()
    expect(nameCounter(32)).toBe('32/40')
  })
})

describe('categorias: diálogo de cor', () => {
  it('UX-71: 8 amostras na ordem do design system, a primeira é Azul', () => {
    expect(CATEGORY_SLOTS.map((slot) => slot.name)).toEqual(['Azul', 'Roxo', 'Laranja', 'Fúcsia', 'Ouro', 'Ciano', 'Café', 'Ardósia'])
  })

  it('UX-73: o valor gravado é o hex claro do slot; a tela pinta com a variável do tema', () => {
    expect(CATEGORY_SLOTS[0]).toMatchObject({ hex: '#2563eb', cssVar: 'var(--cat-azul)' })
  })

  it('UX-74: cor antiga verde, vermelha ou âmbar mostra o aviso e cai no slot mapeado', () => {
    expect(categorySlot('#16a34a').id).toBe('ciano')
    expect(categorySlot('#ef4444').id).toBe('laranja')
    expect(categorySlot('#f59e0b').id).toBe('ouro')
    for (const legacy of ['#16a34a', '#22c55e', '#ef4444', '#f59e0b']) expect(isPaletteColor(legacy)).toBe(false)
    expect(isPaletteColor('#2563EB')).toBe(true)
  })
})

describe('categorias: erros do servidor', () => {
  it('UX-75: exclusão bloqueada (23503) é reconhecida e o link abre Lançamentos filtrado', () => {
    expect(isInUseError(toDataError({ code: '23503', message: 'violates foreign key constraint' }, 'x'))).toBe(true)
    expect(isInUseError(new DataError('Não foi possível excluir a categoria.'))).toBe(false)
    // O texto sozinho não basta: só o code decide.
    expect(isInUseError(new DataError('Este item está em uso e não pode ser excluído.'))).toBe(false)
    expect(isInUseError(new Error('Este item está em uso e não pode ser excluído.'))).toBe(false)
    expect(blockedDeleteText('Mercado')).toMatch(/^Mercado tem lançamentos e não pode ser excluída\./)
    const href = categoryTransactionsHref('2026-11', { id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301', kind: 'expense' })
    const params = new URL(href, 'https://app.local').searchParams
    expect(params.get('mes')).toBe('2026-11')
    expect(readFilters(params)).toEqual({ tipo: 'gastos', categoria: '3f2504e0-4f89-11d3-9a0c-0305e82c3301', busca: '' })
  })

  it('UX-76: nome repetido (23505) vira erro do campo', () => {
    expect(isDuplicateNameError(new DataError('Já existe uma categoria com esse nome.', 'unique_violation'))).toBe(true)
    expect(isDuplicateNameError(toDataError({ code: '23505', message: 'duplicate key value' }, 'x'))).toBe(true)
    expect(isDuplicateNameError(new DataError('Já existe uma categoria com esse nome.'))).toBe(false)
    expect(isDuplicateNameError(toDataError({ code: '23503' }, 'x'))).toBe(false)
  })
})
