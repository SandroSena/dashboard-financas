import { currentMonthKey, monthLabel } from '@/domain/month'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { Button } from '@/shared/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · Finanças`
  }, [title])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function MonthSwitcher() {
  const { month, shift, setMonth } = useMonthParam()
  const isCurrent = month === currentMonthKey()

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => shift(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <p className="min-w-40 text-center text-sm font-medium">{monthLabel(month)}</p>
      <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => shift(1)}>
        <ChevronRight className="size-4" />
      </Button>
      {isCurrent ? null : (
        <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonthKey())}>
          Mês atual
        </Button>
      )}
    </div>
  )
}
