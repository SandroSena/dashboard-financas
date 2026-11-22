import {
  currentMonthKey,
  daysInMonth,
  defaultDateForMonth,
  isIsoDate,
  isMonthKey,
  monthBounds,
  capitalize,
  monthLabel,
  monthName,
  shiftMonth,
} from '@/domain/month'
import { describe, expect, it } from 'vitest'

describe('mês', () => {
  it('monta a chave do mês atual sem deslocar o fuso', () => {
    expect(currentMonthKey(new Date(2026, 10, 17))).toBe('2026-11')
  })

  it('aceita só chaves yyyy-MM', () => {
    expect(isMonthKey('2026-11')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('2026-1')).toBe(false)
    expect(isMonthKey('2026-00')).toBe(false)
  })

  it('avança e volta o mês nas viradas de ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('calcula o intervalo, inclusive fevereiro bissexto', () => {
    expect(monthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
    expect(monthBounds('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' })
    expect(daysInMonth('2026-02')).toHaveLength(28)
    expect(daysInMonth('2026-01')).toHaveLength(31)
  })

  it('escreve o mês em português', () => {
    expect(monthLabel('2026-11')).toBe('Novembro de 2026')
  })

  it('valida datas reais e escolhe o dia padrão do mês', () => {
    expect(isIsoDate('2026-02-31')).toBe(false)
    expect(isIsoDate('2026-11-17')).toBe(true)
    expect(defaultDateForMonth('2026-11', new Date(2026, 10, 17))).toBe('2026-11-17')
    expect(defaultDateForMonth('2026-10', new Date(2026, 10, 17))).toBe('2026-10-01')
  })
})

describe('monthName e capitalize', () => {
  it('devolve só o nome do mês, em minúsculas', () => {
    expect(monthName('2026-11')).toBe('novembro')
    expect(monthName('2026-03')).toBe('março')
  })

  it('deixa só a primeira letra maiúscula', () => {
    expect(capitalize('outubro')).toBe('Outubro')
    expect(capitalize('')).toBe('')
  })
})
