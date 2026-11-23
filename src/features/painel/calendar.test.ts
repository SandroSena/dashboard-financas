import type { Category, Transaction } from '@/domain/types'
import { buildCalendar, calendarKeyTarget, quintileLevels } from '@/features/painel/calendar'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel } from '@/features/painel/model'
import { describe, expect, it } from 'vitest'

const categories: Category[] = [{ id: 'food', name: 'Mercado', kind: 'expense', color: '#c2410c' }]

function tx(id: string, amount: number, occurredOn: string): Transaction {
  return { id, categoryId: 'food', kind: 'expense', description: id, amount, occurredOn }
}

describe('calendário de gastos', () => {
  it('quintis entre os dias com gasto; zero é nível 0 e o maior é 5', () => {
    expect(quintileLevels([0, 10, 20, 30, 40, 50])).toEqual([0, 1, 2, 3, 4, 5])
    expect(quintileLevels([0, 0])).toEqual([0, 0])
    expect(quintileLevels([5])).toEqual([5])
    expect(quintileLevels([10, 10, 50])).toEqual([4, 4, 5])
  })

  it('UX-37: no mês atual, dias futuros ficam desabilitados e hoje fica marcado', () => {
    const model = buildDashboardModel('2026-11', categories, [tx('a', 820, '2026-11-05'), tx('b', 30, '2026-11-12')], [])
    const calendar = buildCalendar(model, buildInsights(model, { today: new Date(2026, 10, 23) }))
    expect(calendar.offset).toBe(0) // 1º de novembro de 2026 é domingo
    expect(calendar.cells[22]).toMatchObject({ isToday: true, isFuture: false })
    expect(calendar.cells[23]?.isFuture).toBe(true)
    expect(calendar.lastEnabled).toBe(22)
    expect(calendar.peak?.date).toBe('2026-11-05')
    expect(calendar.cells[4]?.level).toBe(5)
  })

  it('UX-36: ↓ no dia 12 vai ao dia 19; nunca entra em dia futuro', () => {
    const options = { offset: 0, lastEnabled: 22 }
    expect(calendarKeyTarget(11, 'ArrowDown', options)).toBe(18)
    expect(calendarKeyTarget(18, 'ArrowDown', options)).toBe(18)
    expect(calendarKeyTarget(3, 'ArrowUp', options)).toBe(3)
    expect(calendarKeyTarget(0, 'ArrowLeft', options)).toBe(0)
    expect(calendarKeyTarget(11, 'ArrowRight', options)).toBe(12)
  })

  it('UX-36: Home/End vão ao começo e ao fim da semana', () => {
    // offset 3: o dia 1 cai na quarta; o dia 5 (índice 4) cai no domingo.
    expect(calendarKeyTarget(6, 'Home', { offset: 3, lastEnabled: 29 })).toBe(4)
    expect(calendarKeyTarget(6, 'End', { offset: 3, lastEnabled: 29 })).toBe(10)
    expect(calendarKeyTarget(1, 'Home', { offset: 3, lastEnabled: 29 })).toBe(0)
    expect(calendarKeyTarget(6, 'End', { offset: 3, lastEnabled: 7 })).toBe(7)
    expect(calendarKeyTarget(6, 'Enter', { offset: 3, lastEnabled: 7 })).toBeNull()
  })
})
