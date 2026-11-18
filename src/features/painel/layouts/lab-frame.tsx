import { useCategories } from '@/features/categorias/hooks'
import { useTransactionsBetween } from '@/features/lancamentos/hooks'
import { buildDashboardModel, historyBounds, type DashboardModel } from '@/features/painel/model'
import { LayoutSwitcher } from '@/features/painel/layouts/layout-switcher'
import { useBudgets } from '@/features/orcamentos/hooks'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import type { ReactNode } from 'react'

export function DashboardLab({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: (model: DashboardModel) => ReactNode
}) {
  const { month } = useMonthParam()
  const bounds = historyBounds(month)
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactionsBetween(bounds.start, bounds.end)
  const budgetsQuery = useBudgets(month)
  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error ?? budgetsQuery.error

  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} action={<MonthSwitcher />} />
      <LayoutSwitcher />
      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <QueryError
          message={errorMessage(error)}
          onRetry={() => {
            void categoriesQuery.refetch()
            void transactionsQuery.refetch()
            void budgetsQuery.refetch()
          }}
        />
      ) : (
        children(
          buildDashboardModel(month, categoriesQuery.data ?? [], transactionsQuery.data ?? [], budgetsQuery.data ?? []),
        )
      )}
    </div>
  )
}
