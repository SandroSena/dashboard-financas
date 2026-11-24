import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  deleteBudget,
  listBudgets,
  saveBudget,
  type BudgetInput,
} from '@/features/orcamentos/api/budgets-repository'
import { queryKeys } from '@/shared/lib/query-keys'

/** Metas do mês. Ao trocar de mês, as do mês anterior ficam na tela até as novas chegarem (AC-08). */
export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => listBudgets(month),
    placeholderData: keepPreviousData,
  })
}

export function usePrefetchBudgets() {
  const queryClient = useQueryClient()
  return useCallback(
    (month: string) => {
      void queryClient.prefetchQuery({ queryKey: queryKeys.budgets(month), queryFn: () => listBudgets(month) })
    },
    [queryClient],
  )
}

export function useSaveBudget(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<BudgetInput, 'monthKey'>) => saveBudget({ ...input, monthKey: month }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets(month) }),
  })
}

export function useDeleteBudget(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets(month) }),
  })
}

/**
  Copia metas para o mês aberto, uma a uma (`saveBudget` é upsert, então repetir é seguro).
  Devolve as que falharam para o "Tentar de novo" (cópia parcial, spec seção 2).
*/
export function useCopyBudgets(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: ReadonlyArray<Omit<BudgetInput, 'monthKey'>>) => {
      const results = await Promise.allSettled(items.map((item) => saveBudget({ ...item, monthKey: month })))
      const failed = items.filter((_, index) => results[index].status === 'rejected')
      return { copied: items.length - failed.length, failed }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets(month) }),
  })
}
