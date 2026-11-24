import { useCategories } from '@/features/categorias/hooks'
import type { Prefill } from '@/features/lancamentos/form-defaults'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { QuickAddContext } from '@/features/lancamentos/use-quick-add'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { useState, type ReactNode } from 'react'

/** Um só "Novo lançamento" para o app inteiro: menu lateral, barra do celular, atalho N e telas vazias. */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const { month } = useMonthParam()
  const categoriesQuery = useCategories()
  const [state, setState] = useState<{ open: boolean; prefill: Prefill; key: number }>({
    open: false,
    prefill: {},
    key: 0,
  })
  const categories = categoriesQuery.data ?? []
  const loading = categoriesQuery.isLoading
  const ready = !loading

  function show(prefill: Prefill) {
    if (!ready) return
    setState((current) => ({ open: true, prefill, key: current.key + 1 }))
  }

  return (
    <QuickAddContext.Provider
      value={{
        open: () => show({}),
        openWith: show,
        ready,
        loading,
      }}
    >
      {children}
      {state.open ? (
        <TransactionDialog
          key={state.key}
          open
          onOpenChange={(open) => setState((current) => ({ ...current, open }))}
          month={month}
          categories={categories}
          defaultKind={state.prefill.kind}
          defaultCategoryId={state.prefill.categoryId}
          defaultDate={state.prefill.occurredOn}
        />
      ) : null}
    </QuickAddContext.Provider>
  )
}
