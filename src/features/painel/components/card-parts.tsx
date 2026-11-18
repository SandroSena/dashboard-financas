import { cn } from '@/shared/lib/utils'
import { ArrowRight, ChartColumn, Table2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function ViewToggle({ view, onChange }: { view: 'chart' | 'table'; onChange: (view: 'chart' | 'table') => void }) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="Modo de visualização">
      {(
        [
          ['chart', ChartColumn, 'Ver gráfico'],
          ['table', Table2, 'Ver tabela'],
        ] as const
      ).map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={view === value}
          title={label}
          onClick={() => onChange(value)}
          className={cn(
            'flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
            view === value && 'bg-background text-foreground shadow-sm',
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand/10"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

export function ChartEmpty({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-60 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
