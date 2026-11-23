import { cn } from '@/shared/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

export type SeriesStyle = 'solid' | 'dashed' | 'muted' | 'bar'

/** Amostra do estilo da série (linha cheia, tracejada ou barra): cor nunca sozinha. */
export function SeriesSwatch({ color, style = 'solid' }: { color: string; style?: SeriesStyle }) {
  if (style === 'dashed') {
    return (
      <span className="flex w-4 shrink-0 gap-0.5" aria-hidden="true">
        <span className="h-0.5 flex-1 rounded-full opacity-70" style={{ backgroundColor: color }} />
        <span className="h-0.5 flex-1 rounded-full opacity-70" style={{ backgroundColor: color }} />
      </span>
    )
  }
  if (style === 'bar') {
    return <span className="size-2.5 shrink-0 rounded-chip" style={{ backgroundColor: color }} aria-hidden="true" />
  }
  return <span className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
}

export type TooltipLine = { label: string; value: ReactNode; color: string; style?: SeriesStyle }

/**
  Cartão de dica dos gráficos (design system 10.7, "Tooltip de gráfico"): título, linhas
  com a amostra da série, um bloco extra e um rodapé com a comparação.
*/
export function ChartTooltipCard({
  title,
  lines,
  extra,
  footer,
  hint,
  className,
  style,
}: {
  title: string
  lines: TooltipLine[]
  extra?: ReactNode
  footer?: ReactNode
  hint?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={cn(
        'pop-in pointer-events-none min-w-48 max-w-72 rounded-control bg-popover p-3 text-body-sm text-popover-foreground shadow-overlay',
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      <p className="mb-1.5 text-caption font-semibold text-muted-foreground">{title}</p>
      {lines.length > 0 ? (
        <div className="grid gap-1">
          {lines.map((line) => (
            <p key={line.label} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <SeriesSwatch color={line.color} style={line.style} />
                {line.label}
              </span>
              <span className="figure font-semibold">{line.value}</span>
            </p>
          ))}
        </div>
      ) : null}
      {extra ? <div className="mt-1.5 border-t border-border pt-1.5 text-caption text-muted-foreground">{extra}</div> : null}
      {footer ? <div className="mt-1.5 border-t border-border pt-1.5 text-caption font-semibold">{footer}</div> : null}
      {hint ? <p className="mt-1.5 text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
