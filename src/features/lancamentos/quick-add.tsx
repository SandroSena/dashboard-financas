import { useCategories } from '@/features/categorias/hooks'
import type { Prefill } from '@/features/lancamentos/form-defaults'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { createContext, useContext, useState, type ReactNode } from 'react'

type QuickAdd = {
  /** Abre o diálogo vazio. Pode ser passado direto como `onClick` (ignora o evento). */
  open: () => void
  /**
    Abre com pré-preenchimento vindo do painel: `{ occurredOn: '2026-11-12' }`,
    `{ kind: 'income' }` ou `{ categoryId }`. Valores inválidos são ignorados.
  */
  openWith: (prefill: Prefill) => void
  /** Pode abrir: as categorias já carregaram (com ou sem categoria; sem, o diálogo explica o que fazer). */
  ready: boolean
  /** As categorias ainda estão carregando (o botão fica desabilitado com a dica "Carregando categorias..."). */
  loading: boolean
}

const QuickAddContext = createContext<QuickAdd | null>(null)

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

export function useQuickAdd(): QuickAdd {
  const value = useContext(QuickAddContext)
  if (!value) throw new Error('useQuickAdd precisa ficar dentro de QuickAddProvider')
  return value
}
