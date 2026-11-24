import { toCents } from '@/domain/money'
import { AHEAD_THRESHOLD, type DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'

/*
  Régua do mês (spec do painel, 4.2): a parte cheia é a parte da receita que já saiu,
  a marca fina é hoje e o traço fantasma é onde a comparação estava no mesmo dia.
  Percorrer a régua (cursor de dia) recua o preenchimento ao acumulado daquele dia.
*/

export type RulerTone = 'primary' | 'warning' | 'expense'

/** Cor do preenchimento por estado (tokens do design system). */
export const RULER_TONE_BG: Record<RulerTone, string> = {
  primary: 'bg-primary',
  warning: 'bg-warning',
  expense: 'bg-expense',
}

export type RulerReading = {
  /** Dia mostrado: o do cursor ou, sem cursor, hoje / o último dia (mês passado) / 0 (futuro). */
  day: number
  totalDays: number
  /** Último dia que o cursor alcança (hoje no mês atual, o último no passado, 0 no futuro). */
  maxDay: number
  /** Há cursor fora do dia padrão. */
  hasCursor: boolean
  /** Gasto acumulado até o dia (com cursor) ou do mês todo (sem cursor). */
  spent: number
  /** `spent / receita`; `null` sem receita. */
  share: number | null
  /** Preenchimento da régua, 0..1. */
  fill: number
  /** Posição da marca de hoje (0..1); `null` fora do mês atual. */
  todayPosition: number | null
  /** Posição do cursor (0..1); `null` sem cursor. */
  cursorPosition: number | null
  tone: RulerTone
  /** Quanto os gastos passaram da receita (só sem cursor); `null` se não passaram. */
  overBy: number | null
  comparisonSpent: number | null
  /** Parte da receita da comparação que já tinha saído no mesmo dia. */
  comparisonShare: number | null
}

/** Posição (0..1) do fim de um dia na régua. */
export function dayPosition(day: number, totalDays: number): number {
  if (totalDays <= 0) return 0
  return Math.min(Math.max(day / totalDays, 0), 1)
}

export function rulerReading(
  model: DashboardModel,
  insights: DashboardInsights,
  cursorDay: number | null,
): RulerReading {
  const { totalDays, daysElapsed, isCurrentMonth, comparison } = insights
  const maxDay = daysElapsed
  const cursor = cursorDay !== null && maxDay > 0 ? Math.min(Math.max(cursorDay, 1), maxDay) : null
  const defaultDay = maxDay
  const day = cursor ?? defaultDay
  const hasCursor = cursor !== null && (cursor !== defaultDay || !isCurrentMonth)

  const spent = cursor !== null ? (insights.pace[cursor - 1]?.current ?? 0) : model.expense
  const hasIncome = model.income > 0
  const share = hasIncome ? spent / model.income : null
  const timeShare = day > 0 ? dayPosition(day, totalDays) : null
  const over = share !== null && share > 1
  const ahead = share !== null && timeShare !== null && (isCurrentMonth || cursor !== null) && share >= timeShare + AHEAD_THRESHOLD
  const tone: RulerTone = over ? 'expense' : ahead ? 'warning' : 'primary'

  const comparisonSpent = comparison && day > 0 ? (comparison.cumulative[day - 1] ?? null) : null
  const comparisonShare =
    comparison && comparisonSpent !== null && comparison.income > 0 ? comparisonSpent / comparison.income : null

  return {
    day,
    totalDays,
    maxDay,
    hasCursor,
    spent,
    share,
    fill: share === null ? 0 : Math.min(share, 1),
    todayPosition: isCurrentMonth && daysElapsed > 0 ? dayPosition(daysElapsed, totalDays) : null,
    cursorPosition: hasCursor && cursor !== null ? dayPosition(cursor, totalDays) : null,
    tone,
    overBy: cursor === null && over ? (toCents(model.expense) - toCents(model.income)) / 100 : null,
    comparisonSpent,
    comparisonShare,
  }
}

export type DayKeyAction = { type: 'move'; day: number } | { type: 'open' } | { type: 'reset' }

/**
  Teclas da régua e do gráfico de ritmo (spec, seção 8): ←/→ 1 dia, PageUp/PageDown 7 dias,
  Home/End primeiro/último dia, Enter abre a folha do dia, Esc volta para hoje.
  Tecla que não é do controle → `null` (o navegador segue com ela).
*/
export function dayKeyAction(key: string, current: number, maxDay: number): DayKeyAction | null {
  if (maxDay <= 0) return null
  const clamp = (value: number) => ({ type: 'move' as const, day: Math.min(Math.max(value, 1), maxDay) })
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(current - 1)
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(current + 1)
    case 'PageDown':
      return clamp(current - 7)
    case 'PageUp':
      return clamp(current + 7)
    case 'Home':
      return clamp(1)
    case 'End':
      return clamp(maxDay)
    case 'Enter':
      return { type: 'open' }
    case 'Escape':
      return { type: 'reset' }
    default:
      return null
  }
}

/** Dia sob o ponteiro: posição `x` (px) num trilho de `width` px, limitado a `1..maxDay`. */
export function dayFromPointer(x: number, width: number, totalDays: number, maxDay: number): number | null {
  if (width <= 0 || totalDays <= 0 || maxDay <= 0) return null
  const day = Math.ceil((Math.min(Math.max(x, 0), width) / width) * totalDays)
  return Math.min(Math.max(day, 1), maxDay)
}

/** Dias da escala embaixo da régua: 1, 5, 10, 15, 20, 25 e o último. */
export function rulerTicks(totalDays: number): number[] {
  const ticks = [1, 5, 10, 15, 20, 25].filter((day) => day < totalDays - 1)
  return [...ticks, totalDays]
}
