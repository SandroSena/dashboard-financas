import { formatShortDate } from '@/domain/month'
import { FALLBACK_COLOR, totalByKind } from '@/domain/summary'
import type { Kind, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useDeleteTransaction, useTransactions } from '@/features/lancamentos/hooks'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { EmptyState, LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MoneyText } from '@/shared/components/money-text'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog, NativeSelect } from '@/shared/ui/dialog'
import { Pencil, Plus, Receipt, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type KindFilter = 'all' | Kind

export function TransactionsPage() {
  const { month } = useMonthParam()
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactions(month)
  const [kind, setKind] = useState<KindFilter>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [removing, setRemoving] = useState<Transaction | null>(null)
  const remove = useDeleteTransaction(month)

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const categoryOptions = categories.filter((category) => kind === 'all' || category.kind === kind)
  const filtered = transactions.filter((transaction) => {
    if (kind !== 'all' && transaction.kind !== kind) return false
    if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false
    return true
  })
  const names = new Map(categories.map((category) => [category.id, category]))

  async function confirmRemove() {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      toast.success('Lançamento excluído.')
      setRemoving(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Lançamentos"
        description="Registre onde o dinheiro foi e o valor de cada movimento."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthSwitcher />
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Novo
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-lg bg-muted p-1">
          {(
            [
              ['all', 'Todos'],
              ['expense', 'Gastos'],
              ['income', 'Receitas'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                'h-8 rounded-md px-3 text-sm',
                kind === value ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
              )}
              onClick={() => {
                setKind(value)
                setCategoryId('all')
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <NativeSelect
          aria-label="Filtrar por categoria"
          className="sm:max-w-xs"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="all">Todas as categorias</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {categoriesQuery.isLoading || transactionsQuery.isLoading ? (
        <LoadingBlock />
      ) : categoriesQuery.error || transactionsQuery.error ? (
        <QueryError
          message={errorMessage(categoriesQuery.error ?? transactionsQuery.error)}
          onRetry={() => {
            void categoriesQuery.refetch()
            void transactionsQuery.refetch()
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-5" />}
          title={transactions.length === 0 ? 'Nenhum lançamento neste mês' : 'Nada com esse filtro'}
          description={
            transactions.length === 0
              ? 'Adicione um gasto ou uma receita para ver o total do mês.'
              : 'Troque o tipo ou a categoria para ver outros movimentos.'
          }
          action={
            transactions.length === 0 ? (
              <Button
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                Adicionar lançamento
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul>
            {filtered.map((transaction) => {
              const category = names.get(transaction.categoryId)
              return (
                <li key={transaction.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category?.color ?? FALLBACK_COLOR }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {category?.name ?? 'Categoria'} · {formatShortDate(transaction.occurredOn)}
                    </p>
                  </div>
                  <MoneyText
                    value={transaction.amount}
                    tone={transaction.kind === 'income' ? 'income' : 'expense'}
                    className="font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${transaction.description}`}
                    onClick={() => {
                      setEditing(transaction)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${transaction.description}`}
                    onClick={() => setRemoving(transaction)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-wrap justify-end gap-4 border-t bg-muted/40 px-4 py-3 text-sm">
            <span>
              Gastos <MoneyText value={totalByKind(filtered, 'expense')} tone="expense" className="font-medium" />
            </span>
            <span>
              Receitas <MoneyText value={totalByKind(filtered, 'income')} tone="income" className="font-medium" />
            </span>
          </div>
        </div>
      )}

      {dialogOpen ? (
        <TransactionDialog
          key={editing?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          month={month}
          categories={categories}
          transaction={editing}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Excluir lançamento?"
        description={removing ? `${removing.description} sai da soma deste mês.` : ''}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
