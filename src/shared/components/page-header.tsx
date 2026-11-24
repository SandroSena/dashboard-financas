import { type ReactNode, useEffect } from 'react'

/**
  Título da página (um `h1` por tela) e o título da aba: "Lançamentos | Finanças".
  O seletor de mês mora em `month-switcher.tsx` e entra como `action`.
*/
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
        <h1 className="text-heading font-semibold tracking-tight sm:text-display">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-body text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
