import { monthName } from '@/domain/month'
import { formatBrl } from '@/domain/money'
import type { Category, Transaction } from '@/domain/types'
import { useCategories } from '@/features/categorias/hooks'
import {
  changeKind,
  checkCategoryFilter,
  countLabel,
  EMPTY_FILTERS,
  filterTransactions,
  hasActiveFilters,
  kindOfFilter,
  totalsOf,
  type KindFilter,
  type TransactionFilters,
} from '@/features/lancamentos/filters'
import {
  useCreateTransaction,
  useDeleteTransaction,
  usePrefetchTransactions,
  useTransactions,
} from '@/features/lancamentos/hooks'
import { useQuickAdd } from '@/features/lancamentos/quick-add'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import { TransactionGroups } from '@/features/lancamentos/transaction-groups'
import { useTransactionFilters } from '@/features/lancamentos/use-transaction-filters'
import { EmptyState, LoadingRegion, QueryError } from '@/shared/components/feedback'
import { MonthSwitcher } from '@/shared/components/month-switcher'
import { PageHeader } from '@/shared/components/page-header'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { useMediaQuery } from '@/shared/hooks/use-prefers-reduced-motion'
import { NO_FLASH, nextFlash, type RowFlashMark } from '@/shared/lib/row-flash'
import { errorMessage } from '@/shared/lib/supabase'
import { toastActionError, toastMissingCategory } from '@/shared/lib/toast-error'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { SearchInput } from '@/shared/ui/input'
import { NativeSelect } from '@/shared/ui/select'
import { Segmented } from '@/shared/ui/segmented'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tooltip } from '@/shared/ui/tooltip'
import { Pencil, Plus, Receipt, Search, SearchX, Trash, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const SEARCH_DEBOUNCE_MS = 150

const KIND_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'gastos', label: 'Gastos', tone: 'expense' },
  { value: 'receitas', label: 'Receitas', tone: 'income' },
] as const

/** docs/design/telas/lancamentos.md (UX-50..UX-61). */
export function TransactionsPage() {
  const { month } = useMonthParam()
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactions(month)
  const [urlFilters, setFilters] = useTransactionFilters()
  const remove = useDeleteTransaction(month)
  const restore = useCreateTransaction(month)
  const quickAdd = useQuickAdd()
  const prefetchTransactions = usePrefetchTransactions()
  const desktop = useMediaQuery('(min-width: 768px)')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [removing, setRemoving] = useState<Transaction | null>(null)
  const [flash, setFlash] = useState<RowFlashMark>(NO_FLASH)
  // Trocando de mês: o mês anterior continua visível (esmaecido) até o novo chegar (AC-08).
  const switching = transactionsQuery.isPlaceholderData

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const transactions = transactionsQuery.data ?? []
  const categoriesReady = categoriesQuery.isSuccess

  // Categoria da URL inexistente ou de outro tipo: corrige antes de filtrar (UX-51, AC-15).
  const check = categoriesReady ? checkCategoryFilter(urlFilters, categories) : { status: 'ok' as const, filters: urlFilters }
  const filters = check.filters
  const toastedMissing = useRef<string | null>(null)
  useEffect(() => {
    if (check.status === 'ok') return
    if (check.status === 'missing' && toastedMissing.current !== urlFilters.categoria) {
      toastedMissing.current = urlFilters.categoria
      toastMissingCategory()
    }
    setFilters((current) => checkCategoryFilter(current, categories).filters)
  }, [check.status, categories, setFilters, urlFilters.categoria])

  const filtered = filterTransactions(transactions, filters)
  const totals = totalsOf(filtered)
  const active = hasActiveFilters(filters)
  const name = monthName(month)

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  async function confirmRemove() {
    const target = removing
    if (!target || remove.isPending) return
    try {
      await remove.mutateAsync(target.id)
      setRemoving(null)
      toast.success('Lançamento excluído.', {
        description: 'Para desfazer pelo teclado, Alt+T leva até o aviso.',
        duration: 6000,
        action: { label: 'Desfazer', onClick: () => void undoRemove(target) },
      })
    } catch (error) {
      toastActionError('Não foi possível excluir o lançamento.', error)
    }
  }

  // UX-58: recria com os mesmos dados (o id muda; a linha volta destacada).
  async function undoRemove(target: Transaction) {
    try {
      const created = await restore.mutateAsync({
        categoryId: target.categoryId,
        kind: target.kind,
        description: target.description,
        amount: target.amount,
        occurredOn: target.occurredOn,
      })
      setFlash((current) => nextFlash(current, created.id))
      toast.success('Lançamento de volta.')
    } catch (error) {
      toastActionError('Não foi possível desfazer a exclusão.', error, {
        action: { label: 'Tentar de novo', onClick: () => void undoRemove(target) },
      })
    }
  }

  const loading = categoriesQuery.isLoading || transactionsQuery.isLoading
  const loadError = categoriesQuery.error ?? transactionsQuery.error

  return (
    <div className="grid gap-6 md:gap-8">
      <PageHeader
        title="Lançamentos"
        description="Tudo o que entrou e saiu no mês, dia a dia."
        action={<MonthSwitcher onPrefetch={prefetchTransactions} />}
      />

      <FilterBar
        filters={filters}
        categories={categories}
        desktop={desktop}
        onChange={setFilters}
      />

      {loading ? (
        <TransactionsSkeleton />
      ) : loadError ? (
        <QueryError
          title="Não foi possível carregar os lançamentos."
          message={errorMessage(loadError)}
          onRetry={() => {
            void categoriesQuery.refetch()
            void transactionsQuery.refetch()
          }}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title={`Nenhum lançamento em ${name}`}
          description="Adicionem um gasto ou uma receita para ver o total do mês."
          action={
            <Button disabled={!quickAdd.ready} onClick={quickAdd.open}>
              <Plus aria-hidden="true" />
              Novo lançamento
            </Button>
          }
        />
      ) : (
        <div
          className={cn('grid gap-4 transition-opacity duration-(--duration-base)', switching && 'opacity-60')}
          aria-busy={switching || undefined}
        >
          <Totals expenseCents={totals.expenseCents} incomeCents={totals.incomeCents} balanceCents={totals.balanceCents} />

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-caption text-muted-foreground" aria-live="polite">
              {countLabel(filtered.length)}
            </p>
            {active ? (
              <ActiveFilterChips filters={filters} categories={categories} onChange={setFilters} onClear={clearFilters} />
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              variant="filter"
              icon={<SearchX />}
              title="Nada com esses filtros"
              description="Troquem o tipo, a categoria ou a busca para ver outros movimentos."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <TransactionGroups
              transactions={filtered}
              categories={categories}
              dayTotals
              flash={flash}
              onSelect={desktop ? undefined : setEditing}
              renderActions={
                desktop
                  ? (transaction) => (
                      <>
                        <Tooltip content="Editar">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Editar ${transaction.description}`}
                            onClick={() => setEditing(transaction)}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Excluir">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Excluir ${transaction.description}`}
                            onClick={() => setRemoving(transaction)}
                          >
                            <Trash aria-hidden="true" />
                          </Button>
                        </Tooltip>
                      </>
                    )
                  : undefined
              }
            />
          )}
        </div>
      )}

      {editing ? (
        <TransactionDialog
          key={editing.id}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          month={month}
          categories={categories}
          transaction={editing}
          onSaved={(saved) => setFlash((current) => nextFlash(current, saved.id))}
          onDelete={setRemoving}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null)
        }}
        title="Excluir lançamento?"
        description={
          removing ? `${removing.description}, ${formatBrl(removing.amount)}, sai da soma de ${monthName(removing.occurredOn.slice(0, 7))}.` : ''
        }
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}

function FilterBar({
  filters,
  categories,
  desktop,
  onChange,
}: {
  filters: TransactionFilters
  categories: Category[]
  desktop: boolean
  onChange: (update: (current: TransactionFilters) => TransactionFilters) => void
}) {
  const kind = kindOfFilter(filters.tipo)
  const options = categories.filter((category) => kind === null || category.kind === kind)

  // Busca: o campo responde na hora; a URL e a lista, depois de 150ms (UX-53).
  const [query, setQuery] = useState(filters.busca)
  const [urlBusca, setUrlBusca] = useState(filters.busca)
  if (filters.busca !== urlBusca) {
    setUrlBusca(filters.busca)
    if (filters.busca !== query.trim()) setQuery(filters.busca)
  }
  useEffect(() => {
    if (query.trim() === filters.busca) return
    const timer = window.setTimeout(() => onChange((current) => ({ ...current, busca: query })), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query, filters.busca, onChange])

  // Celular: a busca recolhe num botão de 44px e abre ao tocar.
  const [searchOpen, setSearchOpen] = useState(false)
  const showSearch = desktop || searchOpen || query !== ''

  const search = (
    <div className={cn('min-w-0', desktop ? 'w-full max-w-80' : 'w-full')}>
      <label htmlFor="busca-lancamentos" className="sr-only">
        Buscar lançamentos
      </label>
      <SearchInput
        id="busca-lancamentos"
        placeholder="Buscar pela descrição"
        className="bg-sunken"
        value={query}
        onValueChange={setQuery}
        autoFocus={!desktop && searchOpen}
        onBlur={() => {
          if (!query) setSearchOpen(false)
        }}
        enterKeyHint="search"
      />
    </div>
  )

  const categorySelect = (
    <NativeSelect
      aria-label="Filtrar por categoria"
      className={desktop ? 'max-w-72' : 'min-w-0 flex-1'}
      value={filters.categoria ?? ''}
      onChange={(event) => {
        const value = event.target.value || null
        onChange((current) => ({ ...current, categoria: value }))
      }}
    >
      <option value="">Todas as categorias</option>
      {options.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </NativeSelect>
  )

  const kindControl = (
    <Segmented<KindFilter>
      label="Tipo de lançamento"
      className={desktop ? undefined : 'w-full'}
      value={filters.tipo}
      onChange={(tipo) => onChange((current) => changeKind(current, tipo, categories))}
      options={KIND_OPTIONS}
    />
  )

  if (desktop) {
    return (
      <div className="flex flex-wrap items-center gap-3" role="search" aria-label="Filtros dos lançamentos">
        {kindControl}
        {categorySelect}
        {search}
      </div>
    )
  }

  return (
    <div className="grid gap-3" role="search" aria-label="Filtros dos lançamentos">
      {kindControl}
      <div className="flex items-center gap-2">
        {categorySelect}
        {showSearch ? null : (
          <Button variant="outline" size="icon" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
            <Search aria-hidden="true" />
          </Button>
        )}
      </div>
      {showSearch ? search : null}
    </div>
  )
}

function Totals({ expenseCents, incomeCents, balanceCents }: { expenseCents: number; incomeCents: number; balanceCents: number }) {
  const tiles = [
    { label: 'Gastos', value: `− ${formatBrl(expenseCents / 100)}`, tone: 'text-expense' },
    { label: 'Receitas', value: `+ ${formatBrl(incomeCents / 100)}`, tone: 'text-income' },
    {
      label: 'Saldo',
      value: `${balanceCents < 0 ? '− ' : balanceCents > 0 ? '+ ' : ''}${formatBrl(Math.abs(balanceCents) / 100)}`,
      tone: balanceCents < 0 ? 'text-expense' : balanceCents > 0 ? 'text-income' : 'text-foreground',
    },
  ]
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="surface grid min-w-0 gap-1 p-3 sm:p-4">
          <dt className="eyebrow truncate">{tile.label}</dt>
          <dd className={cn('figure min-w-0 truncate text-body font-semibold md:text-title', tile.tone)} title={tile.value}>
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ActiveFilterChips({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: TransactionFilters
  categories: Category[]
  onChange: (update: (current: TransactionFilters) => TransactionFilters) => void
  onClear: () => void
}) {
  const category = filters.categoria ? categories.find((item) => item.id === filters.categoria) : undefined
  const chips: Array<{ key: string; label: string; remove: () => void }> = []
  if (filters.tipo !== 'todos') {
    chips.push({
      key: 'tipo',
      label: filters.tipo === 'gastos' ? 'Gastos' : 'Receitas',
      remove: () => onChange((current) => ({ ...current, tipo: 'todos' })),
    })
  }
  if (category) {
    chips.push({ key: 'categoria', label: category.name, remove: () => onChange((current) => ({ ...current, categoria: null })) })
  }
  if (filters.busca) {
    chips.push({ key: 'busca', label: `“${filters.busca}”`, remove: () => onChange((current) => ({ ...current, busca: '' })) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">Filtros ativos:</span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Badge className="h-7 max-w-56 gap-0.5 pr-0.5 text-body-sm font-medium">
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                aria-label={`Remover filtro ${chip.label}`}
                onClick={chip.remove}
                className="relative flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors duration-(--duration-fast) hover:bg-accent hover:text-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
              >
                <X aria-hidden="true" />
              </button>
            </Badge>
          </li>
        ))}
      </ul>
      <Button variant="link" size="sm" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  )
}

/** 3 totais + 6 linhas de 56px em 2 dias, nas medidas finais. */
function TransactionsSkeleton() {
  return (
    <LoadingRegion label="Carregando os lançamentos" className="grid gap-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="surface grid gap-2 p-3 sm:p-4">
              <Skeleton className="h-3 w-14 rounded-full" />
              <Skeleton className="h-6 w-4/5 md:h-7" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-36 rounded-full" />
        <div className="surface py-2">
          {[3, 3].map((rows, group) => (
            <div key={group} className="pt-1">
              <Skeleton className="mx-4 mt-3 mb-2 h-3 w-24 rounded-full" />
              {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex h-14 items-center gap-3 px-4">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-2/5 rounded-full" />
                    <Skeleton className="h-3 w-1/4 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  )
}
