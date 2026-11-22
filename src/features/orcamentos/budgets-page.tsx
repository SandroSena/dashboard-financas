import { formatAmountInput, parseBrlInput } from '@/domain/money'
import { budgetStatus, spentByCategory } from '@/domain/summary'
import type { Budget, Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useTransactions } from '@/features/lancamentos/hooks'
import { useBudgets, useDeleteBudget, useSaveBudget } from '@/features/orcamentos/hooks'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { BudgetMeter } from '@/features/orcamentos/budget-meter'
import { EmptyState, LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MoneyText } from '@/shared/components/money-text'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { TextInput } from '@/shared/ui/dialog'
import { Target } from 'lucide-react'
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
    <div className="grid gap-8">
      <PageHeader
        title="Orçamentos"
        description="Quanto pode sair em cada categoria neste mês. Apague o valor para tirar a meta."
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
        <EmptyState
          icon={<Target className="size-5" />}
          title="Nenhuma categoria de gasto"
          description="Crie uma categoria de gasto em Categorias para definir uma meta."
        />
      ) : (
        <ul className="grid gap-2">
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
    <li className="grid gap-4 rounded-xl bg-card p-5 md:grid-cols-[1fr_220px] md:items-center md:gap-8">
      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2.5 font-semibold">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="truncate">{category.name}</span>
          </p>
          <p className="shrink-0 text-sm text-muted-foreground">
            Gasto <MoneyText value={spent} className="font-semibold text-foreground" />
          </p>
        </div>
        {progress ? (
          <BudgetMeter percent={progress.percent} status={progress.status} />
        ) : (
          <p className="text-xs text-muted-foreground">Sem meta. Escreva um valor para começar a acompanhar.</p>
        )}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (dirty && !pending) void onSave()
        }}
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <TextInput
            aria-label={`Meta de ${category.name}`}
            inputMode="decimal"
            placeholder="0,00"
            className="pl-10 tabular-nums"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant={removing ? 'outline' : 'default'}
          className={cn(!dirty && 'invisible')}
          disabled={!dirty || pending}
          aria-hidden={!dirty}
          tabIndex={dirty ? 0 : -1}
        >
          {pending ? 'Salvando...' : removing ? 'Remover' : 'Salvar'}
        </Button>
      </form>
    </li>
  )
}
