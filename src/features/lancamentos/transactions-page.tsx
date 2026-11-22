import { roundMoney } from '@/domain/money'
import { totalByKind } from '@/domain/summary'
import type { Kind, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import { useDeleteTransaction, useTransactions } from '@/features/lancamentos/hooks'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { TransactionGroups } from '@/features/lancamentos/transaction-groups'
import { useQuickAdd } from '@/features/lancamentos/quick-add'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { EmptyState, LoadingBlock, QueryError } from '@/shared/components/feedback'
import { MoneyText } from '@/shared/components/money-text'
import { MonthSwitcher, PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog, NativeSelect, Segmented } from '@/shared/ui/dialog'
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
  const quickAdd = useQuickAdd()

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const categoryOptions = categories.filter((category) => kind === 'all' || category.kind === kind)
  const filtered = transactions.filter((transaction) => {
    if (kind !== 'all' && transaction.kind !== kind) return false
    if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false
    return true
  })

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
    <div className="grid gap-8">
      <PageHeader
        title="Lançamentos"
        description="Tudo o que entrou e saiu no mês, dia a dia."
        action={<MonthSwitcher />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Tipo de lançamento"
          value={kind}
          onChange={(value) => {
            setKind(value)
            setCategoryId('all')
          }}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'expense', label: 'Gastos', tone: 'expense' },
            { value: 'income', label: 'Receitas', tone: 'income' },
          ]}
        />
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
              <Button disabled={!quickAdd.ready} onClick={quickAdd.open}>
                <Plus className="size-4" />
                Novo lançamento
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-6">
          <dl className="grid grid-cols-3 gap-3">
            {(
              [
                ['Gastos', totalByKind(filtered, 'expense'), 'expense'],
                ['Receitas', totalByKind(filtered, 'income'), 'income'],
                ['Saldo', roundMoney(totalByKind(filtered, 'income') - totalByKind(filtered, 'expense')), 'balance'],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label} className="surface grid min-w-0 gap-1 px-4 py-3 sm:px-5 sm:py-4">
                <dt className="eyebrow truncate">{label}</dt>
                <dd className="min-w-0 truncate">
                  <MoneyText value={value} tone={tone} className="figure text-base font-semibold sm:text-xl" />
                </dd>
              </div>
            ))}
          </dl>
          <p className="-mt-3 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'} na lista
          </p>
          <TransactionGroups
            transactions={filtered}
            categories={categories}
            renderActions={(transaction) => (
              <div className="-mr-2 flex shrink-0 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
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
                  className="size-9 hover:text-destructive"
                  aria-label={`Excluir ${transaction.description}`}
                  onClick={() => setRemoving(transaction)}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            )}
          />
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
