import { monthBounds, monthName, shiftMonth } from '@/domain/month'
import { formatAmountInput, formatBrl } from '@/domain/money'
import { useCategories } from '@/features/categorias/hooks'
import { usePrefetchTransactions, useTransactions, useTransactionsBetween } from '@/features/lancamentos/hooks'
import { BudgetMeter } from '@/features/orcamentos/budget-meter'
import {
  useBudgets,
  useCopyBudgets,
  useDeleteBudget,
  usePrefetchBudgets,
  useSaveBudget,
} from '@/features/orcamentos/hooks'
import {
  buildBudgetRows,
  checkDraft,
  copyPlan,
  copyResultText,
  emptyFilterText,
  filterRows,
  INVALID_DRAFT_TEXT,
  percentOf,
  statusCounts,
  statusOf,
  summarize,
  syncDraft,
  type BudgetRowModel,
  type BudgetSummary,
  type StatusFilter,
} from '@/features/orcamentos/model'
import { statusTone } from '@/features/orcamentos/status-tone'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { EmptyState, LoadingRegion, QueryError } from '@/shared/components/feedback'
import { MonthSwitcher } from '@/shared/components/month-switcher'
import { PageHeader } from '@/shared/components/page-header'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { useSearchParam, uuidParam } from '@/shared/hooks/use-search-param'
import { errorMessage } from '@/shared/lib/supabase'
import { toastActionError } from '@/shared/lib/toast-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { MoneyInput } from '@/shared/ui/input'
import { Progress } from '@/shared/ui/progress'
import { Segmented } from '@/shared/ui/segmented'
import { Skeleton } from '@/shared/ui/skeleton'
import { CircleAlert, Copy, Plus, Target, TriangleAlert } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

const progressTone = { ok: 'income', warning: 'warning', over: 'expense' } as const

/** docs/design/telas/orcamentos.md (UX-80..UX-88). */
export function BudgetsPage() {
  const { month } = useMonthParam()
  const previousMonth = shiftMonth(month, -1)
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactions(month)
  const budgetsQuery = useBudgets(month)
  const previousBudgetsQuery = useBudgets(previousMonth)
  const historyQuery = useTransactionsBetween(`${shiftMonth(month, -3)}-01`, monthBounds(previousMonth).end)
  const prefetchTransactions = usePrefetchTransactions()
  const prefetchBudgets = usePrefetchBudgets()
  const copy = useCopyBudgets(month)
  const reducedMotion = usePrefersReducedMotion()
  const [filter, setFilter] = useState<StatusFilter>('todas')
  const [focusCategory, setFocusCategory] = useSearchParam<string | null>('categoria', {
    parse: uuidParam,
    fallback: null,
    history: 'replace',
  })
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const switcherRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef(new Map<string, HTMLInputElement>())

  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error ?? budgetsQuery.error
  /*
    Trocando de mês, as linhas do mês anterior continuam visíveis (esmaecidas) até o novo
    chegar (AC-08), mas ficam travadas: salvar ali gravaria o valor antigo no mês novo.
  */
  const switching = transactionsQuery.isPlaceholderData || budgetsQuery.isPlaceholderData
  const categories = categoriesQuery.data ?? []
  const budgets = budgetsQuery.data ?? []
  const historyReady = historyQuery.isSuccess && !historyQuery.isPlaceholderData
  const rows = buildBudgetRows(categories, budgets, transactionsQuery.data ?? [], {
    month,
    history: historyReady ? historyQuery.data : undefined,
  })
  const summary = summarize(rows, month)
  const counts = statusCounts(rows)
  const visible = filterRows(rows, filter)
  const name = monthName(month)
  const previousName = monthName(previousMonth)
  const plan =
    previousBudgetsQuery.isSuccess && !previousBudgetsQuery.isPlaceholderData && !switching
      ? copyPlan(previousBudgetsQuery.data, budgets, categories)
      : []
  const canCopy = budgets.length === 0 && plan.length > 0

  async function runCopy(items: typeof plan, total = items.length) {
    try {
      const result = await copy.mutateAsync(items)
      const copied = total - result.failed.length
      if (result.failed.length === 0) {
        toast.success(copyResultText(copied, total, previousMonth))
      } else {
        toast.error(copyResultText(copied, total, previousMonth), {
          duration: 8000,
          action: { label: 'Tentar de novo', onClick: () => void runCopy(result.failed, total) },
        })
      }
    } catch (copyError) {
      toast.error(errorMessage(copyError), { duration: 6000 })
    }
  }

  /*
    `inert` tira o foco de dentro das linhas: se a pessoa trocou de mês com `[`/`]` com o
    foco numa linha, ele vai para o seletor de mês antes de o conteúdo travar.
  */
  useLayoutEffect(() => {
    if (!switching) return
    if (!contentRef.current?.contains(document.activeElement)) return
    switcherRef.current?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus()
  }, [switching])

  // UX-86: `?categoria=` rola até a linha e foca o campo, uma vez por link.
  const handled = useRef<string | null>(null)
  const rowsReady = !isLoading && !error && !switching
  useEffect(() => {
    if (!focusCategory || !rowsReady || handled.current === focusCategory) return
    handled.current = focusCategory
    const row = rowRefs.current.get(focusCategory)
    if (!row) {
      // Inexistente ou de outra conta (AC-15): ignora e limpa o parâmetro.
      setFocusCategory(null)
      return
    }
    setFilter('todas')
    row.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' })
    inputRefs.current.get(focusCategory)?.focus({ preventScroll: true })
  }, [focusCategory, rowsReady, reducedMotion, setFocusCategory])

  return (
    <div className="grid gap-6 md:gap-8">
      <PageHeader
        title="Orçamentos"
        description="Quanto pode sair em cada categoria neste mês."
        action={
          <div ref={switcherRef} className="contents">
            <MonthSwitcher
              onPrefetch={(next) => {
                prefetchTransactions(next)
                prefetchBudgets(next)
              }}
            />
          </div>
        }
      />

      {isLoading ? (
        <BudgetsSkeleton />
      ) : error ? (
        <QueryError
          title="Não foi possível carregar os orçamentos."
          message={errorMessage(error)}
          onRetry={() => {
            void categoriesQuery.refetch()
            void transactionsQuery.refetch()
            void budgetsQuery.refetch()
          }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="Nenhuma categoria de gasto"
          description="As metas são por categoria. Criem uma categoria de gasto para começar."
          action={
            <Button asChild>
              <Link to="/categorias?tipo=gastos">
                <Plus aria-hidden="true" />
                Criar categoria
              </Link>
            </Button>
          }
        />
      ) : (
        <div
          ref={contentRef}
          className={cn('grid gap-5 transition-opacity duration-(--duration-base)', switching && 'pointer-events-none opacity-60')}
          aria-busy={switching || undefined}
          inert={switching}
        >
          {summary ? (
            <SummaryCard summary={summary} />
          ) : (
            <div className="flex flex-col gap-4 rounded-card bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-display text-title-sm font-semibold">Nenhuma meta em {name}</p>
                <p className="mt-1 max-w-prose text-body-sm text-muted-foreground">
                  Escrevam um limite ao lado de cada categoria. A partir de 80% a meta entra em alerta.
                </p>
              </div>
              {canCopy ? (
                <Button variant="secondary" className="shrink-0" loading={copy.isPending} onClick={() => void runCopy(plan)}>
                  {copy.isPending ? null : <Copy aria-hidden="true" />}
                  {copy.isPending ? 'Copiando...' : `Copiar metas de ${previousName}`}
                </Button>
              ) : null}
            </div>
          )}

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Segmented<StatusFilter>
              label="Filtrar metas por situação"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'todas', label: `Todas (${counts.todas})` },
                { value: 'estouradas', label: `Estouradas (${counts.estouradas})` },
                { value: 'alerta', label: `Em alerta (${counts.alerta})` },
                { value: 'em-dia', label: `Em dia (${counts['em-dia']})` },
              ]}
            />
          </div>

          <p className="text-caption text-muted-foreground">Apaguem o valor para tirar a meta.</p>

          {visible.length === 0 && filter !== 'todas' ? (
            <Card>
              <EmptyState variant="compact" icon={<Target />} title={emptyFilterText(filter, month)} />
            </Card>
          ) : (
            <ul className="grid gap-3">
              {visible.map((row) => (
                <BudgetRow
                  key={`${month}-${row.category.id}`}
                  month={month}
                  row={row}
                  rowRef={(element) => {
                    if (element) rowRefs.current.set(row.category.id, element)
                    else rowRefs.current.delete(row.category.id)
                  }}
                  inputRef={(element) => {
                    if (element) inputRefs.current.set(row.category.id, element)
                    else inputRefs.current.delete(row.category.id)
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ summary }: { summary: BudgetSummary }) {
  const over = summary.remainingCents < 0
  return (
    <Card className="grid gap-4 p-4 sm:p-6">
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="grid gap-1">
          <dt className="eyebrow">Total das metas</dt>
          <dd className="figure text-title font-semibold">{formatBrl(summary.limitCents / 100)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="eyebrow">Já saiu</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="figure text-title font-semibold">{formatBrl(summary.spentCents / 100)}</span>
            <span className={cn('figure text-body-sm font-semibold', statusTone[summary.status].text)}>{summary.percent}%</span>
          </dd>
        </div>
        <div className="col-span-2 grid gap-1 md:col-span-1">
          <dt className="eyebrow">Ainda cabe</dt>
          <dd className="flex flex-wrap items-baseline gap-x-3">
            {over ? (
              <span className="figure flex items-center gap-1.5 text-title font-semibold text-expense">
                <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
                Passou {formatBrl(Math.abs(summary.remainingCents) / 100)}
              </span>
            ) : (
              <span className="figure text-title font-semibold">{formatBrl(summary.remainingCents / 100)}</span>
            )}
            {summary.perDayCents !== null ? (
              <span className="figure text-body-sm text-muted-foreground">{formatBrl(summary.perDayCents / 100)}/dia</span>
            ) : null}
          </dd>
        </div>
      </dl>
      <Progress
        value={summary.percent}
        max={100}
        size="lg"
        tone={progressTone[summary.status]}
        label="Total das metas"
        valueText={`${summary.percent}% do total das metas`}
      />
    </Card>
  )
}

function BudgetRow({
  month,
  row,
  rowRef,
  inputRef,
}: {
  month: string
  row: BudgetRowModel
  rowRef: (element: HTMLLIElement | null) => void
  inputRef: (element: HTMLInputElement | null) => void
}) {
  const { category, budget } = row
  const save = useSaveBudget(month)
  const remove = useDeleteBudget(month)
  const initial = budget ? formatAmountInput(budget.limitAmount) : ''
  const [draft, setDraft] = useState(initial)
  // A linha não remonta ao salvar (a `key` não tem o valor): o rascunho acompanha o salvo.
  const [syncedInitial, setSyncedInitial] = useState(initial)
  if (syncedInitial !== initial) {
    setSyncedInitial(initial)
    setDraft((current) => syncDraft(current, syncedInitial, initial))
  }
  const [fieldError, setFieldError] = useState<string | null>(null)
  const localInput = useRef<HTMLInputElement | null>(null)
  const check = checkDraft(draft)
  const dirty = draft.trim() !== initial
  const pending = save.isPending || remove.isPending
  const removing = check.kind === 'empty' && Boolean(budget)
  const ids = { status: `meta-${category.id}-status`, error: `meta-${category.id}-erro` }

  // Enquanto a pessoa digita um valor válido, o medidor já mostra a nova meta.
  const limitCents = check.kind === 'valid' ? Math.round(check.amount * 100) : row.limitCents
  const status = limitCents !== null ? statusOf(row.spentCents, limitCents) : null
  const percent = limitCents !== null ? percentOf(row.spentCents, limitCents) : 0
  const remainingCents = limitCents !== null ? limitCents - row.spentCents : null

  async function onSave() {
    if (!dirty || pending) return
    if (check.kind === 'invalid') {
      setFieldError(INVALID_DRAFT_TEXT)
      localInput.current?.focus()
      return
    }
    setFieldError(null)
    try {
      if (check.kind === 'empty') {
        if (!budget) return
        await remove.mutateAsync(budget.id)
        toast.success('Meta removida.')
        return
      }
      await save.mutateAsync({ categoryId: category.id, limitAmount: check.amount })
      toast.success('Meta salva.')
    } catch (saveError) {
      // O valor digitado continua no campo.
      toastActionError(check.kind === 'empty' ? 'Não foi possível remover a meta.' : 'Não foi possível salvar a meta.', saveError)
    }
  }

  return (
    <li ref={rowRef} className="surface grid scroll-mt-24 gap-4 p-4 sm:p-5 md:grid-cols-[1fr_15rem] md:items-start md:gap-8">
      <div className="grid min-w-0 gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/painel?mes=${month}&categoria=${category.id}`}
            className="flex min-w-0 items-center gap-2.5 rounded-control font-semibold underline-offset-4 hover:underline"
          >
            <CategoryAvatar name={category.name} color={category.color} size="sm" />
            <span className="truncate">{category.name}</span>
          </Link>
          <p className="shrink-0 text-body-sm text-muted-foreground">
            Gasto <span className="figure font-semibold text-foreground">{formatBrl(row.spentCents / 100)}</span>
          </p>
        </div>

        {status !== null && remainingCents !== null ? (
          <>
            <BudgetMeter percent={percent} status={status} label={`Meta de ${category.name}`} statusId={ids.status} />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-caption">
              {remainingCents >= 0 ? (
                <span className="figure text-muted-foreground">Restam {formatBrl(remainingCents / 100)}</span>
              ) : (
                <span className="figure flex items-center gap-1 font-semibold text-expense">
                  <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                  Passou {formatBrl(Math.abs(remainingCents) / 100)}
                </span>
              )}
              {row.perDayCents !== null && check.kind !== 'valid' ? (
                <span className="figure text-muted-foreground">Cabem {formatBrl(row.perDayCents / 100)}/dia até o fim do mês</span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="grid gap-1">
            <p id={ids.status} className="text-caption text-muted-foreground">
              Sem meta. Escrevam um valor para começar a acompanhar.
            </p>
            {row.suggestionCents !== null ? (
              <p className="flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                <span className="figure">Média de 3 meses: {formatBrl(row.suggestionCents / 100)}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-8 text-caption"
                  aria-label={`Usar a média de 3 meses como meta de ${category.name}`}
                  onClick={() => {
                    // Preenche sem salvar (UX-85).
                    setDraft(formatAmountInput((row.suggestionCents ?? 0) / 100))
                    setFieldError(null)
                    localInput.current?.focus()
                  }}
                >
                  Usar
                </Button>
              </p>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="grid gap-1.5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void onSave()
        }}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <MoneyInput
              ref={(element) => {
                localInput.current = element
                inputRef(element)
              }}
              aria-label={`Meta de ${category.name}`}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? ids.error : ids.status}
              placeholder="0,00"
              enterKeyHint="done"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                if (fieldError) setFieldError(null)
              }}
            />
          </div>
          {/* O espaço do botão fica reservado, para a linha não pular; invisível não recebe foco. */}
          <Button
            type="submit"
            variant={removing ? 'outline' : 'primary'}
            className={cn(!dirty && 'invisible')}
            disabled={!dirty}
            loading={pending}
            aria-hidden={!dirty || undefined}
            tabIndex={dirty ? 0 : -1}
          >
            {pending ? 'Salvando...' : removing ? 'Remover' : 'Salvar'}
          </Button>
        </div>
        {fieldError ? (
          <p id={ids.error} className="flex items-start gap-1.5 text-body-sm text-expense" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {fieldError}
          </p>
        ) : null}
      </form>
    </li>
  )
}

/** Resumo + 5 linhas, nas medidas finais. */
function BudgetsSkeleton() {
  return (
    <LoadingRegion label="Carregando os orçamentos" className="grid gap-5">
      <div className="grid gap-5">
        <div className="surface grid gap-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={cn('grid gap-2', index === 2 && 'col-span-2 md:col-span-1')}>
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-7 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-11 w-full max-w-lg rounded-full" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-card md:h-28" />
        ))}
      </div>
    </LoadingRegion>
  )
}

