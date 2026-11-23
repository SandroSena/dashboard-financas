import { cn } from '@/shared/lib/utils'
import { useId, type ReactNode } from 'react'

/**
  Card do painel (design system 10.2, `static`): `<section aria-labelledby>` com `h2`,
  descrição e ações à direita (segmentados, gráfico/tabela).
*/
export function PanelCard({
  title,
  description,
  actions,
  className,
  children,
  id,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
  id?: string
}) {
  const titleId = useId()
  return (
    <section id={id} aria-labelledby={titleId} className={cn('surface flex min-w-0 flex-col rounded-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0 sm:p-6 sm:pb-0">
        <div className="min-w-0 flex-1 basis-56">
          <h2 id={titleId} tabIndex={-1} className="text-title-sm font-semibold tracking-tight focus-visible:outline-none">
            {title}
          </h2>
          {description ? <p className="mt-1 text-body-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="grid min-w-0 flex-1 content-start gap-4 p-4 sm:p-6">{children}</div>
    </section>
  )
}

/** Cabeçalho de seção sem caixa (design system 10.2, `section`), com `aria-labelledby`. */
export function PanelSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={cn('grid min-w-0 content-start gap-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-title-sm font-semibold tracking-tight">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
