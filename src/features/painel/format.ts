const compactBrl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 })

export function formatCompactBrl(value: number): string {
  return compactBrl.format(value)
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio)
}
