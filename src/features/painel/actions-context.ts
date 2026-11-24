import type { Kind, Transaction } from '@/domain/types'
import type { RowFlashMark } from '@/shared/lib/row-flash'
import { createContext, useContext } from 'react'

/** Pré-preenchimento do diálogo de lançamento aberto pelo painel. */
export type NewTransactionDefaults = { date?: string; kind?: Kind; categoryId?: string }

/**
  Ações que qualquer card do painel dispara (abrir folha, editar, criar). Ficam num contexto
  para não atravessar cinco níveis de props; quem implementa é `dashboard-page.tsx`.
*/
export type DashboardActions = {
  openCategory: (categoryId: string) => void
  /** `highlightId`: lançamento que a folha marca e foca (vindo de "Maior gasto"). */
  openDay: (date: string, highlightId?: string) => void
  editTransaction: (transaction: Transaction) => void
  newTransaction: (defaults?: NewTransactionDefaults) => void
  /** Pode abrir o diálogo (categorias carregadas). */
  canAdd: boolean
  /** Linha recém-salva, para acender `row-flash` (`token` muda a cada salvamento). */
  flash: RowFlashMark
}

export const DashboardActionsContext = createContext<DashboardActions | null>(null)

export function useDashboardActions(): DashboardActions {
  const value = useContext(DashboardActionsContext)
  if (!value) throw new Error('useDashboardActions precisa ficar dentro do painel')
  return value
}
