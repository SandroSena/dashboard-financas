import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  listTransactionsBetween,
  updateTransaction,
  type TransactionInput,
} from '@/features/lancamentos/api/transactions-repository'
import { queryKeys } from '@/shared/lib/query-keys'

/**
  Lançamentos do mês. Ao trocar de mês, os dados do mês anterior continuam na tela
  (`isPlaceholderData`) até o novo chegar, em vez de voltar ao esqueleto (auditoria P-01, AC-08).
*/
export function useTransactions(month: string) {
  return useQuery({
    queryKey: queryKeys.transactions(month),
    queryFn: () => listTransactions(month),
    placeholderData: keepPreviousData,
  })
}

/** Carrega o mês antes do clique (hover/foco nas setas do seletor de mês, AC-09). */
export function usePrefetchTransactions() {
  const queryClient = useQueryClient()
  return useCallback(
    (month: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.transactions(month),
        queryFn: () => listTransactions(month),
      })
    },
    [queryClient],
  )
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

/** Lançamentos de um intervalo (histórico do painel). Mantém o intervalo anterior na tela ao trocar. */
export function useTransactionsBetween(start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.transactionsRange(start, end),
    queryFn: () => listTransactionsBetween(start, end),
    placeholderData: keepPreviousData,
  })
}

export function usePrefetchTransactionsBetween() {
  const queryClient = useQueryClient()
  return useCallback(
    (start: string, end: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.transactionsRange(start, end),
        queryFn: () => listTransactionsBetween(start, end),
      })
    },
    [queryClient],
  )
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
