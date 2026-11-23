import { describeDelta } from '@/shared/components/delta-format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

const icons = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const

/**
  Variação contra a comparação: pílula com seta + sinal + valor, e o texto "vs outubro"
  ao lado (design system 10.3). A cor diz se é bom ou ruim, mas nunca sozinha.
  Sem valor para comparar (`value === null`), mostra `emptyLabel`.

  @example
  <Delta value={insights.expenseChange} unit="percent" goodWhen="down" comparison="outubro" />
*/
export function Delta({
  value,
  unit,
  goodWhen,
  comparison,
  label,
  emptyLabel,
  className,
}: {
  value: number | null
  unit: 'percent' | 'money'
  goodWhen: 'up' | 'down'
  /** Usado na frase do leitor de tela: "12% a mais que {comparison}". Ex.: "outubro", "a média". */
  comparison: string
  /** Texto visível ao lado da pílula. Padrão: "vs {comparison}". */
  label?: string
  /** Padrão: "Sem {comparison} para comparar". */
  emptyLabel?: string
  className?: string
}) {
  if (value === null) {
    return (
      <span className={cn('text-caption text-muted-foreground', className)}>
        {emptyLabel ?? `Sem ${comparison} para comparar`}
      </span>
    )
  }

  const delta = describeDelta(value, unit, goodWhen, comparison)
  const Icon = icons[delta.direction]

  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 text-caption text-muted-foreground', className)}>
      <span className="sr-only">{delta.srText}</span>
      <Badge tone={delta.tone} className="figure" aria-hidden="true">
        <Icon />
        {delta.text}
      </Badge>
      <span className="truncate" aria-hidden="true">
        {label ?? `vs ${comparison}`}
      </span>
    </span>
  )
}
