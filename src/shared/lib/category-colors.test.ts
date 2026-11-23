import { describe, expect, it } from 'vitest'
import {
  CATEGORY_SLOTS,
  categoryColorVar,
  categorySlot,
  categorySoftColor,
  isPaletteColor,
} from '@/shared/lib/category-colors'

const RESERVED = ['#16a34a', '#22c55e', '#ef4444', '#f59e0b', '#84cc16']

describe('paleta de categorias', () => {
  it('UX-71: tem 8 slots na ordem da grade, com hex claro único', () => {
    expect(CATEGORY_SLOTS.map((slot) => slot.name)).toEqual([
      'Azul',
      'Roxo',
      'Laranja',
      'Fúcsia',
      'Ouro',
      'Ciano',
      'Café',
      'Ardósia',
    ])
    expect(new Set(CATEGORY_SLOTS.map((slot) => slot.hex)).size).toBe(8)
    for (const slot of CATEGORY_SLOTS) expect(slot.hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('UX-73: o hex gravado resolve para o token do tema, que troca sozinho no escuro', () => {
    expect(categoryColorVar('#2563eb')).toBe('var(--cat-azul)')
    expect(categoryColorVar('#2563EB')).toBe('var(--cat-azul)')
    expect(categorySlot('#2563eb').hex).toBe('#2563eb')
  })

  it('UX-73: a versão escura de um slot também resolve para o mesmo slot', () => {
    expect(categorySlot('#60a5fa').id).toBe('azul')
    expect(categorySlot('#94a3b8').id).toBe('ardosia')
  })

  it('UX-74: cores antigas viram os slots da tabela do design system', () => {
    expect(categorySlot('#16a34a').id).toBe('ciano')
    expect(categorySlot('#f97316').id).toBe('laranja')
    expect(categorySlot('#6366f1').id).toBe('azul')
    expect(categorySlot('#ec4899').id).toBe('fucsia')
    expect(categorySlot('#eab308').id).toBe('ouro')
    expect(categorySlot('#ef4444').id).toBe('laranja')
    expect(categorySlot('#a855f7').id).toBe('roxo')
  })

  it('AC-24: nenhuma cor antiga reservada (verde, vermelho, âmbar) continua como cor de categoria', () => {
    for (const hex of RESERVED) {
      const slot = categorySlot(hex)
      expect(slot.hex).not.toBe(hex)
      expect(slot.cssVar).toMatch(/^var\(--cat-/)
    }
  })

  it('AC-24: o avatar usa o token do slot, nunca o hex cru (#eab308 vira Ouro)', () => {
    expect(categorySoftColor('#eab308')).toBe('color-mix(in oklab, var(--cat-ouro) 16%, transparent)')
  })

  it('hex desconhecido, vazio ou nulo vira Ardósia', () => {
    expect(categorySlot('#123456').id).toBe('ardosia')
    expect(categorySlot('').id).toBe('ardosia')
    expect(categorySlot(null).id).toBe('ardosia')
    expect(categorySlot(undefined).id).toBe('ardosia')
  })

  it('UX-74: só os hex claros dos slots contam como "já está na paleta"', () => {
    expect(isPaletteColor('#2563EB')).toBe(true)
    expect(isPaletteColor('#16a34a')).toBe(false)
    expect(isPaletteColor('#60a5fa')).toBe(false)
  })
})
