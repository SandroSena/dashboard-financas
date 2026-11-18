import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  listTransactionsBetween,
  updateTransaction,
  type TransactionInput,
} from '@/features/lancamentos/api/transactions-repository'
import { queryKeys } from '@/shared/lib/query-keys'

export function useTransactions(month: string) {
  return useQuery({
    queryKey: queryKeys.transactions(month),
    queryFn: () => listTransactions(month),
  })
}

export function useCreateTransaction(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(month) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsAll })
    },
  })
}

export function useTransactionsBetween(start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.transactionsRange(start, end),
    queryFn: () => listTransactionsBetween(start, end),
  })
}

export function useUpdateTransaction(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => updateTransaction(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(month) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsAll })
    },
  })
}

export function useDeleteTransaction(month: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(month) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsAll })
    },
  })
}
