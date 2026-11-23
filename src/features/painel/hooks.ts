import { toIsoDate } from '@/domain/month'
import type { Budget, Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { usePrefetchTransactionsBetween, useTransactionsBetween } from '@/features/lancamentos/hooks'
import { useBudgets, usePrefetchBudgets } from '@/features/orcamentos/hooks'
import { buildInsights, type DashboardInsights } from '@/features/painel/insights'
import { buildDashboardModel, historyBounds, type DashboardModel } from '@/features/painel/model'
import {
  DEFAULT_COMPARE,
  DEFAULT_WINDOW,
  MAX_WINDOW,
  parseDashboardParams,
  type CompareMode,
  type HistoryWindow,
} from '@/features/painel/params'
import { withParam } from '@/shared/hooks/use-search-param'
import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/*
  Orquestração das queries do painel (antes duplicada entre dashboard-page e lab-frame).
  O painel sempre busca 12 meses numa só consulta: a troca 6/12 e a média de 3 meses
  saem da mesma lista, sem nova carga (UX-35).
*/

const EMPTY_CATEGORIES: Category[] = []
const EMPTY_TRANSACTIONS: Transaction[] = []
const EMPTY_BUDGETS: Budget[] = []

export type DashboardData = {
  /** Mês a que os dados na tela pertencem (o anterior, enquanto o novo carrega). */
  shownMonth: string
  categories: Category[]
  history: Transaction[]
  budgets: Budget[]
  /** Primeira carga (sem nada para mostrar ainda). */
  isLoading: boolean
  /** Trocando de mês sem cache: a tela atual fica esmaecida (UX-46, AC-08). */
  switching: boolean
  /** Erro geral (categorias ou lançamentos). */
  error: unknown
  /** Erro só das metas: o resto do painel continua (UX-45). */
  budgetsError: unknown
  /** Categorias já chegaram (para validar `?categoria=` sem falso negativo). */
  categoriesReady: boolean
  retry: () => void
  retryBudgets: () => void
}

export function useDashboardData(month: string): DashboardData {
  const bounds = historyBounds(month, MAX_WINDOW)
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactionsBetween(bounds.start, bounds.end)
  const budgetsQuery = useBudgets(month)

  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const switching = transactionsQuery.isPlaceholderData || budgetsQuery.isPlaceholderData

  // Enquanto o mês novo carrega, as queries devolvem os dados do anterior (keepPreviousData).
  // O modelo é montado com o mês a que esses dados pertencem, em vez de voltar ao esqueleto.
  const [settledMonth, setSettledMonth] = useState(month)
  if (!switching && !isLoading && settledMonth !== month) setSettledMonth(month)

  const { refetch: refetchCategories } = categoriesQuery
  const { refetch: refetchTransactions } = transactionsQuery
  const { refetch: refetchBudgets } = budgetsQuery

  return {
    shownMonth: switching ? settledMonth : month,
    categories: categoriesQuery.data ?? EMPTY_CATEGORIES,
    history: transactionsQuery.data ?? EMPTY_TRANSACTIONS,
    budgets: budgetsQuery.data ?? EMPTY_BUDGETS,
    isLoading,
    switching,
    error: categoriesQuery.error ?? transactionsQuery.error,
    budgetsError: budgetsQuery.error,
    categoriesReady: categoriesQuery.isSuccess,
    retry: () => {
      void refetchCategories()
      void refetchTransactions()
      void refetchBudgets()
    },
    retryBudgets: () => void refetchBudgets(),
  }
}

/** Carrega um mês antes do clique (hover/foco nas setas e na grade do seletor, AC-09). */
export function usePrefetchDashboard(): (month: string) => void {
  const prefetchRange = usePrefetchTransactionsBetween()
  const prefetchBudgets = usePrefetchBudgets()
  return useCallback(
    (month: string) => {
      const range = historyBounds(month, MAX_WINDOW)
      prefetchRange(range.start, range.end)
      prefetchBudgets(month)
    },
    [prefetchBudgets, prefetchRange],
  )
}

/** Modelo + insights memoizados por mês, dados e comparação (auditoria 4.6, AC-29). */
export function useDashboardModel(
  data: Pick<DashboardData, 'shownMonth' | 'categories' | 'history' | 'budgets'>,
  compare: CompareMode,
): { model: DashboardModel; insights: DashboardInsights } {
  const { shownMonth, categories, history, budgets } = data
  // Lido uma vez por montagem (o painel recarrega os dados ao voltar para a aba).
  const [todayKey] = useState(() => toIsoDate(new Date()))
  const model = useMemo(
    () => buildDashboardModel(shownMonth, categories, history, budgets),
    [shownMonth, categories, history, budgets],
  )
  const insights = useMemo(() => {
    const [year, monthNumber, day] = todayKey.split('-').map(Number)
    return buildInsights(model, { compare, today: new Date(year, monthNumber - 1, day) })
  }, [model, compare, todayKey])
  return { model, insights }
}

type SheetState = { painelFolha?: boolean } | null

/**
  Estado do painel na URL: `comparar` e `janela` trocam sem histórico (`replace`);
  abrir uma folha (`categoria`/`dia`) faz `push`, para o Voltar fechar. Só uma folha por vez.
*/
export function useDashboardParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const params = parseDashboardParams(searchParams)
  const openedHere = Boolean((location.state as SheetState)?.painelFolha)

  const setCompare = useCallback(
    (next: CompareMode) =>
      setSearchParams((current) => withParam(current, 'comparar', next, DEFAULT_COMPARE), {
        replace: true,
        state: location.state,
      }),
    [location.state, setSearchParams],
  )

  const setWindow = useCallback(
    (next: HistoryWindow) =>
      setSearchParams((current) => withParam(current, 'janela', String(next), DEFAULT_WINDOW), {
        replace: true,
        state: location.state,
      }),
    [location.state, setSearchParams],
  )

  const openSheet = useCallback(
    (name: 'categoria' | 'dia', value: string) => {
      const other = name === 'categoria' ? 'dia' : 'categoria'
      const hasSheet = Boolean(params.category ?? params.day)
      setSearchParams((current) => withParam(withParam(current, other, null), name, value), {
        // Trocar de uma folha para outra não empilha histórico.
        replace: hasSheet,
        state: { painelFolha: true },
      })
    },
    [params.category, params.day, setSearchParams],
  )

  const closeSheet = useCallback(() => {
    // Aberta aqui: volta no histórico (o Voltar do navegador e o Fechar fazem o mesmo).
    // Aberta por link: remove o parâmetro sem criar entrada nova.
    if (openedHere) {
      navigate(-1)
      return
    }
    setSearchParams((current) => withParam(withParam(current, 'categoria', null), 'dia', null), { replace: true })
  }, [navigate, openedHere, setSearchParams])

  /** Remove um parâmetro inválido (categoria excluída, dia de outro mês) sem histórico. */
  const dropSheetParam = useCallback(
    () =>
      setSearchParams((current) => withParam(withParam(current, 'categoria', null), 'dia', null), { replace: true }),
    [setSearchParams],
  )

  return {
    ...params,
    setCompare,
    setWindow,
    openCategory: (id: string) => openSheet('categoria', id),
    openDay: (date: string) => openSheet('dia', date),
    closeSheet,
    dropSheetParam,
  }
}
