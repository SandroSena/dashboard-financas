import { budgetStatusLabel } from '@/domain/summary'
import type { BudgetStatus } from '@/domain/types'
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
  const tone =
    status === 'over' ? 'bg-expense text-expense' : status === 'warning' ? 'bg-warning text-warning' : 'bg-income text-income'
  const [barClass, textClass] = tone.split(' ')

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={textClass}>{label}</span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.min(percent, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={cn('h-full rounded-full', barClass)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  )
}
