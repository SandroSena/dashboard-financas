import { cn } from '@/shared/lib/utils'
import type { CSSProperties } from 'react'

const toneClass = {
  brand: 'bg-brand',
  income: 'bg-income',
  expense: 'bg-expense',
  warning: 'bg-warning',
  neutral: 'bg-chart-muted',
} as const

export type ProgressTone = keyof typeof toneClass

const sizeClass = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' } as const

/**
  Barra de progresso única do app (substitui as 4 cópias). Anima `transform: scaleX`,
  nunca `width` (design system 7).

  - Com `label`: `role="progressbar"` com `aria-valuenow/min/max` e `aria-valuetext`.
  - Sem `label`: decorativa (`aria-hidden`), para quando o número já está escrito ao lado.

  `value` acima de `max` (meta estourada) enche a barra toda; o texto ao lado diz quanto passou.
*/
export function Progress({
  value,
  max = 100,
  tone = 'brand',
  color,
  label,
  valueText,
  size = 'md',
  animateOnMount = false,
  className,
}: {
  value: number
  max?: number
  tone?: ProgressTone
  /** Cor CSS própria (ex.: `categoryColorVar(hex)`); vence `tone`. */
  color?: string
  label?: string
  valueText?: string
  size?: keyof typeof sizeClass
  /** Enche uma vez ao aparecer (`fill-in`). Use só na régua e nas metas do painel. */
  animateOnMount?: boolean
  className?: string
}) {
  const safeMax = max > 0 ? max : 1
  const ratio = Math.min(Math.max(value / safeMax, 0), 1)
  const fillStyle: CSSProperties = { transform: `scaleX(${ratio})`, ...(color ? { backgroundColor: color } : null) }
  const a11y = label
    ? {
        role: 'progressbar' as const,
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': safeMax,
        'aria-valuenow': Math.min(Math.max(value, 0), safeMax),
        'aria-valuetext': valueText,
      }
    : { 'aria-hidden': true as const }

  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-track', sizeClass[size], className)} {...a11y}>
      <div className={cn('absolute inset-0', animateOnMount && 'fill-in')}>
        <div
          className={cn(
            'h-full w-full origin-left rounded-full transition-transform duration-(--duration-chart) ease-fluid',
            color ? null : toneClass[tone],
          )}
          style={fillStyle}
        />
      </div>
    </div>
  )
}
