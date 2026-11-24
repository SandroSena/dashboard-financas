import type { Category, Transaction } from '@/domain/types'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { dayFromPointer, dayKeyAction, rulerReading, rulerTicks } from '@/features/painel/ruler'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [
  { id: 'food', name: 'Mercado', kind: 'expense', color: '#c2410c' },
  { id: 'salary', name: 'Salário', kind: 'income', color: '#0e7490' },
]

function tx(id: string, categoryId: string, amount: number, occurredOn: string): Transaction {
  return { id, categoryId, kind: categoryId === 'salary' ? 'income' : 'expense', description: id, amount, occurredOn }
}

function reading(history: Transaction[], today: Date, cursor: number | null = null) {
  const model = buildDashboardModel('2026-11', categories, history, [])
  const insights = buildInsights(model, { today })
  return rulerReading(model, insights, cursor)
}

const today = new Date(2026, 10, 23)

describe('régua do mês', () => {
  it('UX-12: gasto atrás do calendário fica em primary, com a marca de hoje em 23/30', () => {
    const result = reading([tx('s', 'salary', 1000, '2026-11-01'), tx('a', 'food', 500, '2026-11-05')], today)
    expect(result.tone).toBe('primary')
    expect(result.share).toBe(0.5)
    expect(result.todayPosition).toBeCloseTo(23 / 30)
    expect(result.maxDay).toBe(23)
    expect(result.hasCursor).toBe(false)
  })

  it('UX-13: 3 pontos ou mais à frente do calendário acende o alerta', () => {
    // dia 23/30 = 76,7%; 80% de gasto está 3,3 pontos à frente.
    const result = reading([tx('s', 'salary', 1000, '2026-11-01'), tx('a', 'food', 800, '2026-11-05')], today)
    expect(result.tone).toBe('warning')
  })

  it('UX-14: gastos acima da receita enchem a régua em expense e dizem quanto passou', () => {
    const result = reading([tx('s', 'salary', 1000, '2026-11-01'), tx('a', 'food', 1320, '2026-11-05')], today)
    expect(result.tone).toBe('expense')
    expect(result.fill).toBe(1)
    expect(result.overBy).toBe(320)
  })

  it('UX-15: o cursor no dia 12 recua o preenchimento ao acumulado do dia 12', () => {
    const history = [
      tx('s', 'salary', 1000, '2026-11-01'),
      tx('a', 'food', 100, '2026-11-05'),
      tx('b', 'food', 260, '2026-11-12'),
      tx('c', 'food', 300, '2026-11-20'),
    ]
    const result = reading(history, today, 12)
    expect(result.day).toBe(12)
    expect(result.hasCursor).toBe(true)
    expect(result.spent).toBe(360)
    expect(result.fill).toBeCloseTo(0.36)
    expect(result.cursorPosition).toBeCloseTo(12 / 30)
  })

  it('UX-17: cursor além de hoje fica preso em hoje', () => {
    const result = reading([tx('s', 'salary', 1000, '2026-11-01')], today, 29)
    expect(result.day).toBe(23)
    expect(result.hasCursor).toBe(false)
  })

  it('marca fantasma: percentual da receita da comparação no mesmo dia', () => {
    const history = [
      tx('os', 'salary', 1000, '2026-10-01'),
      tx('oa', 'food', 640, '2026-10-10'),
      tx('s', 'salary', 1000, '2026-11-01'),
    ]
    const result = reading(history, today)
    expect(result.comparisonSpent).toBe(640)
    expect(result.comparisonShare).toBeCloseTo(0.64)
  })

  it('mês passado: sem marca de hoje e o cursor percorre o mês inteiro', () => {
    const result = reading([tx('s', 'salary', 1000, '2026-11-01')], new Date(2026, 11, 5))
    expect(result.todayPosition).toBeNull()
    expect(result.maxDay).toBe(30)
  })

  it('mês futuro: nenhum dia para percorrer', () => {
    const result = reading([], new Date(2026, 9, 5), 4)
    expect(result.maxDay).toBe(0)
    expect(result.cursorPosition).toBeNull()
  })

  it('sem receita: régua sem preenchimento', () => {
    const result = reading([tx('a', 'food', 100, '2026-11-05')], today)
    expect(result.share).toBeNull()
    expect(result.fill).toBe(0)
  })
})

describe('teclado e ponteiro da régua', () => {
  it('UX-15: → três vezes a partir do dia 9 chega ao dia 12', () => {
    let day = 9
    for (let index = 0; index < 3; index++) {
      const action = dayKeyAction('ArrowRight', day, 23)
      if (action?.type === 'move') day = action.day
    }
    expect(day).toBe(12)
  })

  it('UX-16 / UX-17: Enter abre, Esc volta; PageUp/PageDown andam 7; Home/End vão às pontas', () => {
    expect(dayKeyAction('Enter', 12, 23)).toEqual({ type: 'open' })
    expect(dayKeyAction('Escape', 12, 23)).toEqual({ type: 'reset' })
    expect(dayKeyAction('PageUp', 12, 23)).toEqual({ type: 'move', day: 19 })
    expect(dayKeyAction('PageDown', 3, 23)).toEqual({ type: 'move', day: 1 })
    expect(dayKeyAction('Home', 12, 23)).toEqual({ type: 'move', day: 1 })
    expect(dayKeyAction('End', 12, 23)).toEqual({ type: 'move', day: 23 })
    expect(dayKeyAction('ArrowRight', 23, 23)).toEqual({ type: 'move', day: 23 })
    expect(dayKeyAction('Tab', 12, 23)).toBeNull()
    expect(dayKeyAction('ArrowRight', 1, 0)).toBeNull()
  })

  it('o ponteiro vira dia, limitado aos dias percorríveis', () => {
    expect(dayFromPointer(0, 300, 30, 23)).toBe(1)
    expect(dayFromPointer(115, 300, 30, 23)).toBe(12)
    expect(dayFromPointer(299, 300, 30, 23)).toBe(23)
    expect(dayFromPointer(10, 0, 30, 23)).toBeNull()
  })

  it('escala: 1, 5, 10, 15, 20, 25 e o último dia', () => {
    expect(rulerTicks(30)).toEqual([1, 5, 10, 15, 20, 25, 30])
    expect(rulerTicks(28)).toEqual([1, 5, 10, 15, 20, 25, 28])
  })
})
