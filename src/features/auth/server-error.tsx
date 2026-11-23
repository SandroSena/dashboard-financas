import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/** Erro do servidor acima do botão: caixa `expense-soft`, ícone e `role="alert"` (spec seção 4). */
export function ServerError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-control bg-expense-soft px-3.5 py-3 text-body-sm text-expense">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0">{children}</p>
    </div>
  )
}
