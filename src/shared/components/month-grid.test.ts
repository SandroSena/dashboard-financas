import { describe, expect, it } from 'vitest'
import { joinMonthKey, monthGridTarget, splitMonthKey } from '@/shared/components/month-grid'

describe('grade do seletor de mês', () => {
  it('UX-04: setas laterais andam um mês, sem sair do ano', () => {
    expect(monthGridTarget(4, 'ArrowRight')).toBe(5)
    expect(monthGridTarget(4, 'ArrowLeft')).toBe(3)
    expect(monthGridTarget(0, 'ArrowLeft')).toBe(0)
    expect(monthGridTarget(11, 'ArrowRight')).toBe(11)
  })

  it('UX-04: setas verticais andam uma linha (3 meses); nas bordas o foco fica', () => {
    expect(monthGridTarget(4, 'ArrowDown')).toBe(7)
    expect(monthGridTarget(4, 'ArrowUp')).toBe(1)
    expect(monthGridTarget(1, 'ArrowUp')).toBe(1)
    expect(monthGridTarget(10, 'ArrowDown')).toBe(10)
  })

  it('UX-04: Home e End vão para janeiro e dezembro; outras teclas não navegam', () => {
    expect(monthGridTarget(6, 'Home')).toBe(0)
    expect(monthGridTarget(6, 'End')).toBe(11)
    expect(monthGridTarget(6, 'Enter')).toBeNull()
  })

  it('converte a chave do mês para ano/índice e de volta', () => {
    expect(splitMonthKey('2026-11')).toEqual({ year: 2026, index: 10 })
    expect(joinMonthKey(2026, 0)).toBe('2026-01')
    expect(joinMonthKey(2025, 11)).toBe('2025-12')
  })
})
