import { formatBrl } from '@/domain/money'
import { monthName, shiftMonth } from '@/domain/month'
import type { Budget, Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useTransactionsBetween } from '@/features/lancamentos/hooks'
import { useQuickAdd } from '@/features/lancamentos/quick-add'
import { useBudgets } from '@/features/orcamentos/hooks'
import { CategoryBreakdown } from '@/features/painel/charts'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel, historyBounds } from '@/features/painel/model'
import { ChartEmpty } from '@/features/painel/components/card-parts'
import { KpiStrip } from '@/features/painel/components/kpi-cards'
import { EmptyMonth, MonthHero } from '@/features/painel/components/summary-cards'
import { PaceCard, MonthlyCard } from '@/features/painel/components/trend-cards'
import { HighlightsCard, BudgetsCard, RecentCard } from '@/features/painel/components/detail-cards'
import { DashboardSkeleton, QueryError } from '@/shared/components/feedback'
import { MonthSwitcher } from '@/shared/components/page-header'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { errorMessage } from '@/shared/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Receipt } from 'lucide-react'
import { useEffect, useMemo } from 'react'

export function DashboardPage() {
  const { month } = useMonthParam()
  const bounds = historyBounds(month)
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactionsBetween(bounds.start, bounds.end)
  const budgetsQuery = useBudgets(month)
  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error ?? budgetsQuery.error

  useEffect(() => {
    document.title = 'Painel | Finanças'
  }, [])

  return (
    <div className="grid gap-8 md:gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">{greeting()}</p>
          <p className="mt-0.5 text-sm text-muted-foreground first-letter:uppercase">{today()}</p>
        </div>
        <MonthSwitcher />
      </header>
      {isLoading ? (
        <DashboardSkeleton />
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
        <DashboardContent
          month={month}
          categories={categoriesQuery.data ?? []}
          history={transactionsQuery.data ?? []}
          budgets={budgetsQuery.data ?? []}
        />
      )}
    </div>
  )
}

function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function today(now = new Date()): string {
  return format(now, "EEEE, d 'de' MMMM", { locale: ptBR })
}

function DashboardContent({
  month,
  categories,
  history,
  budgets,
}: {
  month: string
  categories: Category[]
  history: Transaction[]
  budgets: Budget[]
}) {
  const quickAdd = useQuickAdd()
  const model = useMemo(() => buildDashboardModel(month, categories, history, budgets), [month, categories, history, budgets])
  const insights = useMemo(() => buildInsights(model, history), [model, history])
  const previousLabel = monthName(shiftMonth(month, -1))
  const isEmpty = model.incomeCount + model.expenseCount === 0

  return (
    <div className="grid gap-10 md:gap-12">
      {isEmpty ? <EmptyMonth month={month} onAdd={quickAdd.open} disabled={!quickAdd.ready} /> : null}

      <div className="grid gap-8">
        <MonthHero model={model} insights={insights} month={month} />
        <KpiStrip model={model} insights={insights} previousLabel={previousLabel} month={month} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <PaceCard model={model} insights={insights} previousLabel={previousLabel} className="xl:col-span-2" />
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Para onde foi o dinheiro</CardTitle>
            <CardDescription>
              {model.expense > 0
                ? `${formatBrl(model.expense)} em gastos, por categoria.`
                : 'Gastos do mês por categoria.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {insights.categories.length === 0 ? (
              <ChartEmpty icon={Receipt} message="Nenhum gasto neste mês ainda." />
            ) : (
              <CategoryBreakdown items={insights.categories} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <BudgetsCard usage={model.usage} month={month} />
        <RecentCard
          transactions={model.recent}
          categories={categories}
          month={month}
          onAdd={quickAdd.open}
          canAdd={quickAdd.ready}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <MonthlyCard model={model} className="xl:col-span-2" />
        <HighlightsCard model={model} insights={insights} />
      </div>
    </div>
  )
}
