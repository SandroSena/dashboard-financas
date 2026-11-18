import { monthLabel, shiftMonth } from '@/domain/month'
import type { Budget, Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useTransactionsBetween } from '@/features/lancamentos/hooks'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { useBudgets } from '@/features/orcamentos/hooks'
import { CategoryBreakdown } from '@/features/painel/charts'
import { buildInsights } from '@/features/painel/insights'
import { buildDashboardModel, historyBounds } from '@/features/painel/model'
import { ChartEmpty } from '@/features/painel/components/card-parts'
import { BalanceHero, KpiTile, BudgetTile, EmptyMonth } from '@/features/painel/components/summary-cards'
import { PaceCard, MonthlyCard } from '@/features/painel/components/trend-cards'
import { HighlightsCard, BudgetsCard, RecentCard } from '@/features/painel/components/detail-cards'
import { LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ArrowDownRight, ArrowUpRight, Plus, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'

export function DashboardPage() {
  const { month } = useMonthParam()
  const bounds = historyBounds(month)
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactionsBetween(bounds.start, bounds.end)
  const budgetsQuery = useBudgets(month)
  const [dialogOpen, setDialogOpen] = useState(false)
  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error ?? budgetsQuery.error
  const categories = categoriesQuery.data ?? []

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Painel"
        description={`${greeting()}! Este é o resumo de ${monthLabel(month).toLowerCase()}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthSwitcher />
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={categories.length === 0}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" />
              Novo lançamento
            </Button>
          </div>
        }
      />
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
        <DashboardContent
          month={month}
          categories={categories}
          history={transactionsQuery.data ?? []}
          budgets={budgetsQuery.data ?? []}
          onAdd={() => setDialogOpen(true)}
        />
      )}
      {dialogOpen ? (
        <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} month={month} categories={categories} />
      ) : null}
    </div>
  )
}

function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function DashboardContent({
  month,
  categories,
  history,
  budgets,
  onAdd,
}: {
  month: string
  categories: Category[]
  history: Transaction[]
  budgets: Budget[]
  onAdd: () => void
}) {
  const model = useMemo(() => buildDashboardModel(month, categories, history, budgets), [month, categories, history, budgets])
  const insights = useMemo(() => buildInsights(model, history), [model, history])
  const previousLabel = model.months.find((point) => point.key === shiftMonth(month, -1))?.label ?? 'mês anterior'
  const isEmpty = model.incomeCount + model.expenseCount === 0

  return (
    <div className="grid gap-4">
      {isEmpty ? <EmptyMonth onAdd={onAdd} month={month} /> : null}

      <section className="fade-up grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <BalanceHero model={model} insights={insights} previousLabel={previousLabel} />
        <KpiTile
          label="Receitas"
          icon={ArrowUpRight}
          tone="income"
          value={model.income}
          hint={model.incomeCount === 1 ? '1 entrada' : `${model.incomeCount} entradas`}
          change={insights.incomeChange}
          goodWhen="up"
          previousLabel={previousLabel}
          spark={model.months.map((point) => point.income)}
        />
        <KpiTile
          label="Gastos"
          icon={ArrowDownRight}
          tone="expense"
          value={model.expense}
          hint={model.expenseCount === 1 ? '1 saída' : `${model.expenseCount} saídas`}
          change={insights.expenseChange}
          goodWhen="down"
          previousLabel={previousLabel}
          spark={model.months.map((point) => point.expense)}
        />
        <BudgetTile model={model} insights={insights} month={month} />
      </section>

      <section className="fade-up grid gap-4 lg:grid-cols-3" style={{ animationDelay: '60ms' }}>
        <PaceCard model={model} insights={insights} previousLabel={previousLabel} />
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Para onde foi o dinheiro</CardTitle>
            <CardDescription>Gastos do mês por categoria.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {insights.categories.length === 0 ? (
              <ChartEmpty icon={Receipt} message="Nenhum gasto neste mês ainda." />
            ) : (
              <CategoryBreakdown items={insights.categories} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="fade-up grid gap-4 lg:grid-cols-3" style={{ animationDelay: '120ms' }}>
        <MonthlyCard model={model} />
        <HighlightsCard model={model} insights={insights} />
      </section>

      <section className="fade-up grid gap-4 lg:grid-cols-2" style={{ animationDelay: '180ms' }}>
        <BudgetsCard usage={model.usage} month={month} />
        <RecentCard transactions={model.recent} categories={categories} month={month} onAdd={onAdd} />
      </section>
    </div>
  )
}
