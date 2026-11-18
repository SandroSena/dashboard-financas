import { formatAmountInput, parseBrlInput } from '@/domain/money'
import { budgetStatus, spentByCategory } from '@/domain/summary'
import type { Budget, Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useTransactions } from '@/features/lancamentos/hooks'
import { useBudgets, useDeleteBudget, useSaveBudget } from '@/features/orcamentos/hooks'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { BudgetMeter } from '@/features/orcamentos/budget-meter'
import { LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MoneyText } from '@/shared/components/money-text'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { TextInput } from '@/shared/ui/dialog'
import { useState } from 'react'
import { toast } from 'sonner'

export function BudgetsPage() {
  const { month } = useMonthParam()
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactions(month)
  const budgetsQuery = useBudgets(month)
  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error ?? budgetsQuery.error
  const expenseCategories = (categoriesQuery.data ?? []).filter((category) => category.kind === 'expense')

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Orçamentos"
        description="Defina quanto pode sair em cada categoria. Deixe em branco para tirar a meta."
        action={<MonthSwitcher />}
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
      ) : expenseCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Crie uma categoria de gasto para definir uma meta.</p>
      ) : (
        <ul className="grid gap-3">
          {expenseCategories.map((category) => {
            const budget = (budgetsQuery.data ?? []).find((item) => item.categoryId === category.id)
            return (
              <BudgetRow
                key={`${category.id}-${budget?.limitAmount ?? 'sem-meta'}`}
                month={month}
                category={category}
                budget={budget}
                transactions={transactionsQuery.data ?? []}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}

function BudgetRow({
  month,
  category,
  budget,
  transactions,
}: {
  month: string
  category: Category
  budget?: Budget
  transactions: Transaction[]
}) {
  const save = useSaveBudget(month)
  const remove = useDeleteBudget(month)
  const initial = budget ? formatAmountInput(budget.limitAmount) : ''
  const [draft, setDraft] = useState(initial)
  const spent = spentByCategory(transactions, category.id)
  const parsed = parseBrlInput(draft)
  const progress = parsed ? budgetStatus(spent, parsed) : budget ? budgetStatus(spent, budget.limitAmount) : null
  const dirty = draft.trim() !== initial
  const pending = save.isPending || remove.isPending
  const removing = !draft.trim() && Boolean(budget)

  async function onSave() {
    try {
      if (!draft.trim()) {
        if (!budget) return
        await remove.mutateAsync(budget.id)
        toast.success('Meta removida.')
        return
      }
      const limitAmount = parseBrlInput(draft)
      if (limitAmount == null) {
        toast.error('Informe uma meta maior que zero.')
        return
      }
      await save.mutateAsync({ categoryId: category.id, limitAmount })
      toast.success('Meta salva.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[1fr_180px_auto] md:items-center">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-medium">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
            {category.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Gasto <MoneyText value={spent} />
          </p>
        </div>
        {progress ? <BudgetMeter percent={progress.percent} status={progress.status} /> : null}
      </div>
      <TextInput
        aria-label={`Meta de ${category.name}`}
        inputMode="decimal"
        placeholder="0,00"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button onClick={() => void onSave()} disabled={!dirty || pending}>
        {pending ? 'Salvando...' : removing ? 'Remover' : 'Salvar'}
      </Button>
    </li>
  )
}
