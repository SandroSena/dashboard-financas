import type { BudgetStatus } from '@/domain/types'
import { meterValueText, STATUS_LABEL } from '@/features/orcamentos/model'
import { statusTone } from '@/features/orcamentos/status-tone'
import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/ui/progress'

const progressTone = { ok: 'income', warning: 'warning', over: 'expense' } as const

/**
  Barra da meta + status com ícone e percentual (cor nunca sozinha). O medidor é um
  `progressbar` com `aria-valuenow` limitado a 100 e `aria-valuetext` "83% da meta, em dia".
  `statusId` vai no texto do status, para o campo da meta apontar para ele (`aria-describedby`).
*/
export function BudgetMeter({
  percent,
  status,
  label,
  statusId,
  className,
}: {
  percent: number
  status: BudgetStatus
  /** Nome acessível do medidor, ex.: "Meta de Mercado". */
  label: string
  statusId?: string
  className?: string
}) {
  const tone = statusTone[status]
  const StatusIcon = tone.icon

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Progress value={percent} max={100} tone={progressTone[status]} size="lg" label={label} valueText={meterValueText(percent, status)} />
      <p id={statusId} className={cn('flex items-center gap-1 text-caption font-semibold', tone.text)}>
        <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
        {STATUS_LABEL[status]}, <span className="figure">{percent}%</span>
        <span className="sr-only"> da meta</span>
      </p>
    </div>
  )
}
