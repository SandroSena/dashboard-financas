import { monthName } from '@/domain/month'

/*
  Formatos de texto do painel. Os `Intl.*Format` são criados uma vez (o painel formata
  centenas de valores por render) e as datas são montadas à mão a partir de `AAAA-MM-DD`,
  sem `new Date(iso)` (que leria em UTC e voltaria um dia no Brasil).
*/

const compactBrl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 })

const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const
const WEEKDAY_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const
const WEEKDAY_ABBR = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'] as const

/** Cabeçalho do calendário, começando no domingo. */
export const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

/** "R$ 2 mil", para eixos de gráfico. */
export function formatCompactBrl(value: number): string {
  return compactBrl.format(value)
}

/** 0.71 → "71%". */
export function formatPercent(ratio: number): string {
  return percent.format(ratio)
}

function parts(iso: string): { year: number; month: number; day: number; weekday: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day, weekday: new Date(year, month - 1, day).getDay() }
}

/** "2026-11-12" → "12 de nov." */
export function formatDayShort(iso: string): string {
  const { month, day } = parts(iso)
  return `${day} de ${MONTH_ABBR[month - 1]}.`
}

/** "2026-11-12" → "12 de novembro" */
export function formatDayLong(iso: string): string {
  const { day } = parts(iso)
  return `${day} de ${monthName(iso.slice(0, 7))}`
}

/** "2026-11-12" → "Quinta, 12 de novembro" (título da folha do dia). */
export function formatWeekdayLong(iso: string): string {
  return `${WEEKDAY_LONG[parts(iso).weekday]}, ${formatDayLong(iso)}`
}

/** "2026-11-12" → "qui., 12 nov." (dica do calendário). */
export function formatWeekdayShort(iso: string): string {
  const { month, day, weekday } = parts(iso)
  return `${WEEKDAY_ABBR[weekday]}, ${day} ${MONTH_ABBR[month - 1]}.`
}

/** Dia da semana do dia 1 (0 = domingo), para alinhar a grade do calendário. */
export function weekdayOf(iso: string): number {
  return parts(iso).weekday
}

/** "2026-11" + 12 → "2026-11-12". */
export function isoOfDay(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

/** "1 lançamento" / "3 lançamentos". */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
