import { currentMonthKey, monthLabel } from '@/domain/month'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { cn } from '@/shared/lib/utils'
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
    document.title = `${title} | Finanças`
  }, [title])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.05]">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function MonthSwitcher({ className }: { className?: string }) {
  const { month, shift, setMonth } = useMonthParam()
  const isCurrent = month === currentMonthKey()

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center rounded-full bg-card p-1">
        <StepButton label="Mês anterior" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </StepButton>
        <p className="min-w-36 px-1 text-center text-sm font-semibold" aria-live="polite">
          {monthLabel(month)}
        </p>
        <StepButton label="Próximo mês" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </StepButton>
      </div>
      {isCurrent ? null : (
        <button
          type="button"
          className="h-10 cursor-pointer rounded-full px-3 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
          onClick={() => setMonth(currentMonthKey())}
        >
          Voltar para hoje
        </button>
      )}
    </div>
  )
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-accent hover:text-foreground active:scale-90"
    >
      {children}
    </button>
  )
}
