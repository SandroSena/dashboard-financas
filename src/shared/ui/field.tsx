import { cn } from '@/shared/lib/utils'
import { CircleAlert } from 'lucide-react'
import { FieldContext } from '@/shared/ui/field-context'
import type { ReactNode } from 'react'

/**
  Rótulo visível → controle → ajuda ou erro (design system 10.4).
  O erro substitui a ajuda, tem ícone e `role="alert"`, e fica ligado ao controle
  por `aria-describedby`.
*/
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode
  htmlFor: string
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}) {
  const hintId = `${htmlFor}-ajuda`
  const errorId = `${htmlFor}-erro`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <FieldContext.Provider value={{ id: htmlFor, describedBy, invalid: Boolean(error) }}>
      <div className={cn('grid gap-1.5', className)}>
        <label htmlFor={htmlFor} className="text-body-sm font-medium">
          {label}
        </label>
        {children}
        {error ? (
          <p id={errorId} className="flex items-start gap-1.5 text-body-sm text-expense" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-caption text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  )
}
