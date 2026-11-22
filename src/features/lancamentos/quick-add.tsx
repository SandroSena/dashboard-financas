import { useCategories } from '@/features/categorias/hooks'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { createContext, useContext, useState, type ReactNode } from 'react'

type QuickAdd = { open: () => void; ready: boolean }

const QuickAddContext = createContext<QuickAdd | null>(null)

/** Um só "Novo lançamento" para o app inteiro: menu lateral, barra do celular e telas vazias. */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const { month } = useMonthParam()
  const categoriesQuery = useCategories()
  const [open, setOpen] = useState(false)
  const categories = categoriesQuery.data ?? []

  return (
    <QuickAddContext.Provider value={{ open: () => setOpen(true), ready: categories.length > 0 }}>
      {children}
      {open ? <TransactionDialog open={open} onOpenChange={setOpen} month={month} categories={categories} /> : null}
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd(): QuickAdd {
  const value = useContext(QuickAddContext)
  if (!value) throw new Error('useQuickAdd precisa ficar dentro de QuickAddProvider')
  return value
}
