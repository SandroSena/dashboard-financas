import { formatBrl, roundMoney } from '@/domain/money'

export type DeltaDirection = 'up' | 'down' | 'flat'
export type DeltaTone = 'income' | 'expense' | 'neutral'

export type DeltaDescription = {
  direction: DeltaDirection
  /** Bom (`income`) ou ruim (`expense`) para este indicador; zero é `neutral`. */
  tone: DeltaTone
  /** Texto visível, com sinal: "+12%", "−R$ 80,00", "0%". */
  text: string
  /** Frase para o leitor de tela: "12% a mais que outubro". */
  srText: string
}

/**
  Variação contra a comparação (design system 10.3, "Delta"). Regra de apresentação
  pura, sem React: o sinal e a direção vêm sempre junto com a cor.

  @param value variação já calculada (pontos percentuais inteiros ou reais).
  @param goodWhen `up` para receita/saldo (subir é bom), `down` para gasto.
  @param comparison com o que se compara, já no texto da frase ("outubro", "a média").
*/
export function describeDelta(
  value: number,
  unit: 'percent' | 'money',
  goodWhen: 'up' | 'down',
  comparison: string,
): DeltaDescription {
  const rounded = unit === 'money' ? roundMoney(value) : Math.round(value)
  const direction: DeltaDirection = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const tone: DeltaTone =
    direction === 'flat' ? 'neutral' : (direction === 'up') === (goodWhen === 'up') ? 'income' : 'expense'
  const magnitude = unit === 'percent' ? `${Math.abs(rounded)}%` : formatBrl(Math.abs(rounded))
  const sign = direction === 'up' ? '+' : direction === 'down' ? '−' : ''

  return {
    direction,
    tone,
    text: `${sign}${magnitude}`,
    srText:
      direction === 'flat'
        ? `Igual a ${comparison}`
        : `${magnitude} a ${direction === 'up' ? 'mais' : 'menos'} que ${comparison}`,
  }
}
