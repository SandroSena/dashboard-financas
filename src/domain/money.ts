const MAX_AMOUNT = 9_999_999_999.99

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Criar um Intl.NumberFormat é caro; o painel formata centenas de valores por render.
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBrl(value: number): string {
  return brl.format(roundMoney(value))
}

export function formatAmountInput(value: number): string {
  return roundMoney(value).toFixed(2).replace('.', ',')
}

export function parseBrlInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let normalized = trimmed.replace(/\s/g, '')
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return null
  return roundMoney(value)
}

/** Converte para centavos inteiros, para somar sem erro de ponto flutuante. */
export function toCents(value: number): number {
  return Math.round(value * 100)
}
