import { cn } from '@/shared/lib/utils'
import { ChartColumn, Table2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function ViewToggle({ view, onChange }: { view: 'chart' | 'table'; onChange: (view: 'chart' | 'table') => void }) {
  return (
    <div className="flex shrink-0 rounded-full bg-muted p-1" role="group" aria-label="Modo de visualização">
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
            'flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-[background-color,color] duration-200 hover:text-foreground',
            view === value && 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12)]',
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}

export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
    >
      {children}
    </Link>
  )
}

export function ChartEmpty({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input px-6 text-center">
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="max-w-64 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
