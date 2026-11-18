import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteBudget,
  listBudgets,
  saveBudget,
  type BudgetInput,
} from '@/features/orcamentos/api/budgets-repository'
import { queryKeys } from '@/shared/lib/query-keys'

export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => listBudgets(month),
  })
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
