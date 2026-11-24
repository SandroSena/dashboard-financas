import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { CircleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

/**
  Estado vazio único do app (design system 10.9). Texto sempre convida a agir.
  - `page`: contorno tracejado, para a área principal da tela.
  - `compact`: dentro de card, sem contorno, ícone sem círculo (substitui ChartEmpty/EmptyChart).
  - `filter`: há dados, mas o filtro esconde tudo; a ação costuma ser "Limpar filtros".
*/
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'page',
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  variant?: 'page' | 'compact' | 'filter'
  className?: string
}) {
  const compact = variant === 'compact'
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'px-4 py-8' : 'rounded-card border border-dashed border-input px-6 py-14',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center [&_svg]:size-5',
          compact ? 'mb-3 text-muted-foreground' : 'mb-4 size-12 rounded-full bg-brand-soft text-brand',
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <p className={cn('font-display font-semibold', compact ? 'text-body' : 'text-title-sm')}>{title}</p>
      {description ? <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className={compact ? 'mt-4' : 'mt-5'}>{action}</div> : null}
    </div>
  )
}

/**
  Erro de carregamento, em português e sem detalhe interno (a mensagem vem de `errorMessage`).
  `compact` fica dentro de um card e o resto da tela continua funcionando.
*/
export function QueryError({
  message,
  onRetry,
  title = 'Não foi possível carregar os dados.',
  variant = 'page',
  className,
}: {
  message: string
  onRetry: () => void
  title?: string
  variant?: 'page' | 'compact'
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-card bg-expense-soft text-body-sm sm:flex-row sm:items-center sm:justify-between',
        variant === 'compact' ? 'p-4' : 'p-5',
        className,
      )}
    >
      <p className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-expense" aria-hidden="true" />
        <span>
          <span className="font-semibold">{title}</span> {message}
        </span>
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  )
}

/** Só mostra depois de `delay` ms, para um carregamento rápido não piscar o esqueleto. */
function useDelayed(delay: number): boolean {
  const [visible, setVisible] = useState(delay <= 0)
  useEffect(() => {
    if (delay <= 0) return
    const timer = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])
  return visible
}

/**
  Contêiner de carregamento: `role="status"`, `aria-busy` e rótulo para o leitor de tela.
  O esqueleto dentro só aparece depois de 200ms; o espaço já fica reservado
  (`invisible`), então a tela não pula.
*/
export function LoadingRegion({
  label,
  delay = 200,
  className,
  children,
}: {
  label: string
  delay?: number
  className?: string
  children: ReactNode
}) {
  const visible = useDelayed(delay)
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <div className={cn(!visible && 'invisible')}>{children}</div>
    </div>
  )
}

/** Esqueleto do painel: mesmas posições do conteúdo final, para a tela não pular ao carregar. */
export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Carregando o painel" className="grid gap-10 md:gap-12">
      <div className="grid gap-10 md:gap-12">
        <div className="grid gap-3">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-14 w-3/4 max-w-xl sm:h-20" />
          <Skeleton className="h-4 w-2/3 max-w-lg rounded-full" />
          <Skeleton className="mt-4 h-3.5 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="surface grid gap-3 p-4 sm:p-5">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-card xl:col-span-2" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export function LoadingBlock({ label = 'Carregando' }: { label?: string }) {
  return (
    <LoadingRegion label={label}>
      <div className="grid gap-5">
        <Skeleton className="h-10 w-2/3 max-w-md rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-card lg:col-span-2" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    </LoadingRegion>
  )
}

/** Lista de cards ou linhas com a altura final (ex.: 6 categorias de 72px). */
export function ListSkeleton({
  label = 'Carregando',
  count = 6,
  itemClassName = 'h-18',
  className = 'grid gap-2',
}: {
  label?: string
  count?: number
  itemClassName?: string
  className?: string
}) {
  return (
    <LoadingRegion label={label}>
      <div className={className}>
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className={cn('rounded-card', itemClassName)} />
        ))}
      </div>
    </LoadingRegion>
  )
}
