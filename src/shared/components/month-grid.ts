/** Rótulos curtos da grade 3×4 do seletor de mês. */
export const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

const COLUMNS = 3

/**
  Próximo índice (0–11) na grade de meses para a tecla apertada, ou `null` se a tecla
  não navega. Setas andam 1 (lados) ou 3 (cima/baixo, uma linha); Home/End vão às pontas.
  A grade não passa de ano: nas bordas, o foco fica onde está.
*/
export function monthGridTarget(index: number, key: string): number | null {
  const clamp = (value: number) => Math.min(Math.max(value, 0), 11)
  switch (key) {
    case 'ArrowLeft':
      return clamp(index - 1)
    case 'ArrowRight':
      return clamp(index + 1)
    case 'ArrowUp':
      return index - COLUMNS >= 0 ? index - COLUMNS : index
    case 'ArrowDown':
      return index + COLUMNS <= 11 ? index + COLUMNS : index
    case 'Home':
      return 0
    case 'End':
      return 11
    default:
      return null
  }
}

/** "2026-11" → { year: 2026, index: 10 }. */
export function splitMonthKey(monthKey: string): { year: number; index: number } {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, index: month - 1 }
}

/** { year: 2026, index: 10 } → "2026-11". */
export function joinMonthKey(year: number, index: number): string {
  return `${year}-${String(index + 1).padStart(2, '0')}`
}
