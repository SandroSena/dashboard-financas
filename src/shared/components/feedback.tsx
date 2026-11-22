import { Button } from '@/shared/ui/button'
import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-destructive/8 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        <span className="font-semibold">Não foi possível carregar os dados.</span> {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  )
}

/** Esqueleto do painel: mesmas posições do conteúdo final, para a tela não pular ao carregar. */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-10 md:gap-12" role="status" aria-label="Carregando o painel">
      <div className="grid gap-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-14 w-3/4 max-w-xl animate-pulse rounded-2xl bg-muted sm:h-20" />
        <div className="h-4 w-2/3 max-w-lg animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-3.5 w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="surface grid gap-3 p-4 sm:p-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="h-96 animate-pulse rounded-xl bg-muted xl:col-span-2" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

export function LoadingBlock() {
  return (
    <div className="grid gap-5" aria-hidden="true">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
