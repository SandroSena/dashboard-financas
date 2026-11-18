import { formatAmountInput, formatBrl, parseBrlInput, roundMoney } from '@/domain/money'
import { describe, expect, it } from 'vitest'

function normalize(value: string): string {
  return value.replace(/\u00a0/g, ' ')
}

describe('dinheiro', () => {
  it('formata real com duas casas', () => {
    expect(normalize(formatBrl(1234.5))).toBe('R$ 1.234,50')
    expect(normalize(formatBrl(10))).toBe('R$ 10,00')
  })

  it('arredonda para centavos', () => {
    expect(roundMoney(10.126)).toBe(10.13)
    expect(formatAmountInput(10.5)).toBe('10,50')
  })

  it('entende valor digitado em português', () => {
    expect(parseBrlInput('10,50')).toBe(10.5)
    expect(parseBrlInput('1.234,56')).toBe(1234.56)
    expect(parseBrlInput('10.5')).toBe(10.5)
    expect(parseBrlInput('  8 ')).toBe(8)
  })

  it('recusa vazio, zero, negativo e formato inválido', () => {
    expect(parseBrlInput('')).toBeNull()
    expect(parseBrlInput('0')).toBeNull()
    expect(parseBrlInput('0,00')).toBeNull()
    expect(parseBrlInput('-1')).toBeNull()
    expect(parseBrlInput('10,555')).toBeNull()
    expect(parseBrlInput('abc')).toBeNull()
    expect(parseBrlInput('1.234.56')).toBeNull()
  })
})
