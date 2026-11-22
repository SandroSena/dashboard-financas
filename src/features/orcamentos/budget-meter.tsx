import { budgetStatusLabel } from '@/domain/summary'
import type { BudgetStatus } from '@/domain/types'
import { statusTone } from '@/features/orcamentos/status-tone'
import { cn } from '@/shared/lib/utils'

export function BudgetMeter({
  percent,
  status,
  label = budgetStatusLabel(status),
}: {
  percent: number
  status: BudgetStatus
  label?: string
}) {
  const tone = statusTone[status]
  const StatusIcon = tone.icon

  return (
    <div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-valuenow={Math.min(percent, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-fluid', tone.bar)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={cn('flex items-center gap-1 font-semibold', tone.text)}>
          <StatusIcon className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">{percent}% da meta</span>
      </div>
    </div>
  )
}
