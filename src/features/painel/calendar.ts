import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel, DayStat } from '@/features/painel/model'
import { weekdayOf } from '@/features/painel/format'

/*
  "Dias do mês" (spec do painel, 4.7): mapa de calor do gasto por dia. Cor por quintil
  dos dias com gasto (seq-1..seq-5), dia sem gasto em `track`, dias futuros desabilitados.
*/

export type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5

export type CalendarCell = DayStat & {
  level: HeatLevel
  isFuture: boolean
  isToday: boolean
}

export type CalendarModel = {
  /** Células vazias antes do dia 1 (0 = o mês começa no domingo). */
  offset: number
  cells: CalendarCell[]
  /** Índice da última célula clicável (−1 se o mês inteiro é futuro). */
  lastEnabled: number
  /** Dia que mais pesou; `null` sem gasto. */
  peak: CalendarCell | null
  hasExpense: boolean
}

/**
  Nível de 1 a 5 de cada valor positivo pelo quintil entre os valores positivos
  (empates ficam no mesmo nível, o maior sempre é 5); zero é nível 0.
*/
export function quintileLevels(values: readonly number[]): HeatLevel[] {
  const positive = values.filter((value) => value > 0).sort((left, right) => left - right)
  const count = positive.length
  return values.map((value) => {
    if (value <= 0 || count === 0) return 0
    // Posição do último empate: valores iguais caem no mesmo degrau.
    let low = 0
    let high = count
    while (low < high) {
      const middle = (low + high) >> 1
      if (positive[middle] <= value) low = middle + 1
      else high = middle
    }
    return Math.min(5, Math.max(1, Math.ceil((low / count) * 5))) as HeatLevel
  })
}

export function buildCalendar(model: DashboardModel, insights: DashboardInsights): CalendarModel {
  const levels = quintileLevels(model.days.map((day) => day.expense))
  const cells: CalendarCell[] = model.days.map((day, index) => ({
    ...day,
    level: levels[index] ?? 0,
    isFuture: day.day > insights.daysElapsed,
    isToday: insights.isCurrentMonth && day.day === insights.daysElapsed,
  }))
  const peak = cells.reduce<CalendarCell | null>(
    (best, cell) => (cell.expense > 0 && (best === null || cell.expense > best.expense) ? cell : best),
    null,
  )
  return {
    offset: weekdayOf(`${model.month}-01`),
    cells,
    lastEnabled: insights.daysElapsed - 1,
    peak,
    hasExpense: peak !== null,
  }
}

/**
  Navegação da grade com foco itinerante: setas andam 1 dia (lados) ou 1 semana
  (cima/baixo), Home/End vão ao começo/fim da semana. O foco nunca entra em dia futuro
  nem sai do mês: nesses casos fica onde está. Tecla que não navega → `null`.
*/
export function calendarKeyTarget(
  index: number,
  key: string,
  { offset, lastEnabled }: { offset: number; lastEnabled: number },
): number | null {
  if (lastEnabled < 0) return null
  const column = (offset + index) % 7
  const within = (target: number) => (target >= 0 && target <= lastEnabled ? target : index)
  switch (key) {
    case 'ArrowLeft':
      return within(index - 1)
    case 'ArrowRight':
      return within(index + 1)
    case 'ArrowUp':
      return within(index - 7)
    case 'ArrowDown':
      return within(index + 7)
    case 'Home':
      return Math.max(index - column, 0)
    case 'End':
      return Math.min(index + (6 - column), lastEnabled)
    default:
      return null
  }
}
