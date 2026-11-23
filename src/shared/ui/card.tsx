import { cn } from '@/shared/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import type { HTMLAttributes, ReactNode } from 'react'

/**
  Superfície de card (design system 10.2): tom `card`, `rounded-card` e um fio de 1px.
  `interactive` é para o card inteiro clicável: use com `asChild` e um `<Link>`/`<button>`
  dentro, e não ponha outros controles no card (evita botão dentro de link).
*/
export function Card({
  className,
  interactive = false,
  asChild = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div'
  return <Comp className={cn('surface rounded-card', interactive && 'surface-interactive', className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-4 pb-0 sm:p-6 sm:pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-title-sm font-semibold tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-6', className)}
      {...props}
    />
  )
}

/** Variante `section`: sem caixa, título e conteúdo direto na página. */
export function Section({
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
  return (
    <section className={cn('grid content-start gap-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-title-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
