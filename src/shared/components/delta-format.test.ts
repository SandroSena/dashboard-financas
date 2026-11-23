import { describe, expect, it } from 'vitest'
import { describeDelta } from '@/shared/components/delta-format'

const nbsp = (value: string) => value.replace(/\s/g, ' ')

describe('describeDelta', () => {
  it('gasto subindo é ruim: seta para cima, sinal + e tom expense', () => {
    const delta = describeDelta(12, 'percent', 'down', 'outubro')
    expect(delta).toEqual({ direction: 'up', tone: 'expense', text: '+12%', srText: '12% a mais que outubro' })
  })

  it('receita subindo é boa: tom income', () => {
    expect(describeDelta(8, 'percent', 'up', 'outubro').tone).toBe('income')
  })

  it('gasto caindo é bom: sinal de menos tipográfico (−), tom income', () => {
    const delta = describeDelta(-5, 'percent', 'down', 'a média')
    expect(delta.direction).toBe('down')
    expect(delta.tone).toBe('income')
    expect(delta.text).toBe('−5%')
    expect(delta.srText).toBe('5% a menos que a média')
  })

  it('em reais, formata o valor absoluto com sinal', () => {
    const delta = describeDelta(-80, 'money', 'up', 'outubro')
    expect(nbsp(delta.text)).toBe('−R$ 80,00')
    expect(delta.tone).toBe('expense')
    expect(nbsp(delta.srText)).toBe('R$ 80,00 a menos que outubro')
  })

  it('zero (ou resíduo de ponto flutuante) é neutro e sem sinal', () => {
    expect(describeDelta(0, 'percent', 'up', 'outubro')).toEqual({
      direction: 'flat',
      tone: 'neutral',
      text: '0%',
      srText: 'Igual a outubro',
    })
    expect(describeDelta(0.1 + 0.2 - 0.3, 'money', 'up', 'outubro').direction).toBe('flat')
  })
})
