import { addMonths, format, lastDayOfMonth, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const REFERENCE = new Date(2000, 0, 1)

function parseMonthStart(monthKey: string): Date {
  return parse(`${monthKey}-01`, 'yyyy-MM-dd', REFERENCE)
}

export function isMonthKey(value: string): boolean {
  return MONTH_KEY.test(value)
}

export function currentMonthKey(now = new Date()): string {
  return format(now, 'yyyy-MM')
}

export function shiftMonth(monthKey: string, delta: number): string {
  return format(addMonths(parseMonthStart(monthKey), delta), 'yyyy-MM')
}

export function monthBounds(monthKey: string): { start: string; end: string } {
  const startDate = parseMonthStart(monthKey)
  return {
    start: `${monthKey}-01`,
    end: format(lastDayOfMonth(startDate), 'yyyy-MM-dd'),
  }
}

export function monthLabel(monthKey: string): string {
  return capitalize(format(parseMonthStart(monthKey), "MMMM 'de' yyyy", { locale: ptBR }))
}

/** Só o nome do mês, em minúsculas: "novembro". */
export function monthName(monthKey: string): string {
  return format(parseMonthStart(monthKey), 'MMMM', { locale: ptBR })
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function daysInMonth(monthKey: string): string[] {
  const last = Number(monthBounds(monthKey).end.slice(-2))
  return Array.from({ length: last }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `${monthKey}-${day}`
  })
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function formatShortDate(value: string): string {
  if (!isIsoDate(value)) return value
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(year, month - 1, day),
  )
}

export function defaultDateForMonth(monthKey: string, today = new Date()): string {
  const iso = toIsoDate(today)
  if (iso.startsWith(`${monthKey}-`)) return iso
  return `${monthKey}-01`
}
