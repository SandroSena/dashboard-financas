import { currentMonthKey } from '@/domain/month'
import type { Category, Kind } from '@/domain/types'
import { CategoryDialog } from '@/features/categorias/category-dialog'
import { nextFocusId } from '@/features/categorias/focus-after-removal'
import { useCategories, useDeleteCategory } from '@/features/categorias/hooks'
import {
  blockedDeleteText,
  categoryMonthStats,
  categoryTabParam,
  categoryTransactionsHref,
  isInUseError,
  kindOfTab,
  monthStatLines,
  sortByMonthTotal,
  tabAriaLabel,
  tabOfKind,
  type CategoryTab,
  type MonthStat,
} from '@/features/categorias/model'
import { useTransactions } from '@/features/lancamentos/hooks'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { EmptyState, LoadingRegion, QueryError } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/page-header'
import { RowFlash } from '@/shared/components/row-flash'
import { useMediaQuery } from '@/shared/hooks/use-prefers-reduced-motion'
import { useSearchParam } from '@/shared/hooks/use-search-param'
import { NO_FLASH, flashTokenFor, nextFlash, type RowFlashMark } from '@/shared/lib/row-flash'
import { errorMessage } from '@/shared/lib/supabase'
import { toastActionError } from '@/shared/lib/toast-error'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Tooltip } from '@/shared/ui/tooltip'
import { Ellipsis, Pencil, Plus, Receipt, Tags, Trash } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

type DialogState = { mode: 'new'; kind: Kind } | { mode: 'edit'; category: Category } | null

/** docs/design/telas/categorias.md (UX-70..UX-78). */
export function CategoriesPage() {
  const categoriesQuery = useCategories()
  // O card mostra o mês atual (não o `?mes` do menu): é o retrato de agora.
  const month = currentMonthKey()
  const transactionsQuery = useTransactions(month)
  const remove = useDeleteCategory()
  const navigate = useNavigate()
  const desktop = useMediaQuery('(min-width: 768px)')
  const [tab, setTab] = useSearchParam<CategoryTab>('tipo', { parse: categoryTabParam, fallback: 'gastos', history: 'replace' })
  const [dialog, setDialog] = useState<DialogState>(null)
  const [removing, setRemoving] = useState<Category | null>(null)
  const [flash, setFlash] = useState<RowFlashMark>(NO_FLASH)
  /*
    Foco ao fechar a confirmação (WCAG 2.4.3). Quem abriu (o "Excluir" do popover ou do
    diálogo) some da página, então a tela diz o alvo: cancelar volta ao "Mais ações" do card
    (ou ao card, no celular); excluir vai para o card seguinte ou para "Nova categoria".
  */
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const all = categoriesQuery.data ?? []
  const stats = categoryMonthStats(transactionsQuery.data ?? [])
  const counts = {
    gastos: all.filter((category) => category.kind === 'expense').length,
    receitas: all.filter((category) => category.kind === 'income').length,
  }

  const visibleCategories = sortByMonthTotal(
    all.filter((category) => category.kind === kindOfTab(tab)),
    stats,
  )

  function cardFocusTarget(id: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-focus-card="${id}"]`)
  }

  function openRemove(category: Category) {
    returnFocusRef.current = cardFocusTarget(category.id)
    setRemoving(category)
  }

  function openNew(kind: Kind) {
    setDialog({ mode: 'new', kind })
  }

  async function confirmRemove() {
    const target = removing
    if (!target || remove.isPending) return
    try {
      await remove.mutateAsync(target.id)
      const nextId = nextFocusId(
        visibleCategories.map((category) => category.id),
        target.id,
      )
      returnFocusRef.current = (nextId ? cardFocusTarget(nextId) : null) ?? document.querySelector<HTMLElement>('[data-focus-new-category]')
      setRemoving(null)
      toast.success('Categoria excluída.')
    } catch (error) {
      setRemoving(null)
      if (isInUseError(error)) {
        const href = categoryTransactionsHref(month, target)
        toast.error(blockedDeleteText(target.name), {
          duration: 8000,
          action: { label: 'Ver lançamentos', onClick: () => navigate(href) },
        })
        return
      }
      toastActionError('Não foi possível excluir a categoria.', error)
    }
  }

  return (
    <div className="grid gap-6 md:gap-8">
      <PageHeader
        title="Categorias"
        description="Como vocês separam o que entra e o que sai."
        action={
          <Button data-focus-new-category className="w-full sm:w-auto" onClick={() => openNew(kindOfTab(tab))}>
            <Plus aria-hidden="true" />
            Nova categoria
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(categoryTabParam(value) ?? 'gastos')}>
        <TabsList aria-label="Tipo de categoria">
          {(['gastos', 'receitas'] as const).map((value) => (
            <TabsTrigger key={value} value={value} aria-label={categoriesQuery.isSuccess ? tabAriaLabel(value, counts[value]) : undefined}>
              {value === 'gastos' ? 'Gastos' : 'Receitas'}
              {categoriesQuery.isSuccess ? (
                <span className="figure text-caption text-muted-foreground" aria-hidden="true">
                  {counts[value]}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          {categoriesQuery.isLoading ? (
            <CategoriesSkeleton />
          ) : categoriesQuery.error ? (
            <QueryError
              title="Não foi possível carregar as categorias."
              message={errorMessage(categoriesQuery.error)}
              onRetry={() => void categoriesQuery.refetch()}
            />
          ) : (
            <CategoryGrid
              tab={tab}
              categories={visibleCategories}
              stats={stats}
              statsLoading={transactionsQuery.isLoading}
              statsFailed={Boolean(transactionsQuery.error)}
              month={month}
              desktop={desktop}
              flash={flash}
              onNew={() => openNew(kindOfTab(tab))}
              onEdit={(category) => setDialog({ mode: 'edit', category })}
              onRemove={openRemove}
            />
          )}
        </TabsContent>
      </Tabs>

      {dialog ? (
        <CategoryDialog
          key={dialog.mode === 'edit' ? dialog.category.id : `new-${dialog.kind}`}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          category={dialog.mode === 'edit' ? dialog.category : null}
          defaultKind={dialog.mode === 'new' ? dialog.kind : dialog.category.kind}
          onSaved={(saved) => {
            setFlash((current) => nextFlash(current, saved.id))
            if (tabOfKind(saved.kind) !== tab) setTab(tabOfKind(saved.kind))
          }}
          onDelete={openRemove}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null)
        }}
        title={removing ? `Excluir ${removing.name}?` : 'Excluir categoria?'}
        description="Dá para excluir só se ela não tiver lançamentos. As metas dessa categoria também saem."
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => void confirmRemove()}
        returnFocusRef={returnFocusRef}
        returnFocusPriority="ref"
      />
    </div>
  )
}

function CategoryGrid({
  tab,
  categories,
  stats,
  statsLoading,
  statsFailed,
  month,
  desktop,
  flash,
  onNew,
  onEdit,
  onRemove,
}: {
  tab: CategoryTab
  categories: Category[]
  stats: ReadonlyMap<string, MonthStat>
  statsLoading: boolean
  statsFailed: boolean
  month: string
  desktop: boolean
  flash: RowFlashMark
  onNew: () => void
  onEdit: (category: Category) => void
  onRemove: (category: Category) => void
}) {
  if (categories.length === 0) {
    const expense = tab === 'gastos'
    return (
      <EmptyState
        icon={<Tags />}
        title={expense ? 'Nenhuma categoria de gasto' : 'Nenhuma categoria de receita'}
        description={
          expense
            ? 'Criem categorias como Mercado, Casa e Transporte para separar os gastos.'
            : 'Criem categorias como Salário e Extras.'
        }
        action={
          <Button onClick={onNew}>
            <Plus aria-hidden="true" />
            Nova categoria
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-3">
      {statsFailed ? (
        <p className="text-caption text-muted-foreground">Não deu para carregar os totais do mês agora. As categorias continuam editáveis.</p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard
              category={category}
              stat={stats.get(category.id)}
              statsLoading={statsLoading}
              statsFailed={statsFailed}
              month={month}
              desktop={desktop}
              flashToken={flashTokenFor(flash, category.id)}
              onEdit={() => onEdit(category)}
              onRemove={() => onRemove(category)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryCard({
  category,
  stat,
  statsLoading,
  statsFailed,
  month,
  desktop,
  flashToken,
  onEdit,
  onRemove,
}: {
  category: Category
  stat: MonthStat | undefined
  statsLoading: boolean
  statsFailed: boolean
  month: string
  desktop: boolean
  flashToken: number | null
  onEdit: () => void
  onRemove: () => void
}) {
  const lines = monthStatLines(stat, month)
  const body = (
    <>
      <RowFlash token={flashToken} className="rounded-card" />
      <CategoryAvatar name={category.name} color={category.color} size="lg" className="relative" />
      <span className="relative grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-body font-semibold">{category.name}</span>
        {statsLoading ? (
          <Skeleton className="mt-1 h-3 w-32 rounded-full" />
        ) : statsFailed ? null : (
          <span className="grid text-caption text-muted-foreground">
            <span className="figure truncate">{lines.total}</span>
            {lines.count ? <span className="truncate">{lines.count}</span> : null}
          </span>
        )}
      </span>
    </>
  )

  if (!desktop) {
    // Celular: o card inteiro é o alvo e abre a edição (UX-78).
    return (
      <Card interactive asChild>
        <button
          type="button"
          onClick={onEdit}
          data-focus-card={category.id}
          aria-label={`Editar ${category.name}${statsLoading || statsFailed ? '' : `, ${lines.total}${lines.count ? `, ${lines.count}` : ''}`}`}
          className="relative flex min-h-22 w-full items-center gap-3 p-4 text-left"
        >
          {body}
        </button>
      </Card>
    )
  }

  return (
    <Card className="relative flex min-h-22 items-center gap-3 p-4">
      {body}
      <div className="relative -mr-1 flex shrink-0 self-start">
        <Tooltip content="Editar">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Editar ${category.name}`}
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" />
          </Button>
        </Tooltip>
        <Popover>
          <Tooltip content="Mais ações">
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Mais ações para ${category.name}`}
                data-focus-card={category.id}
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent align="end" className="grid w-56 gap-0.5 p-1.5" aria-label={`Ações de ${category.name}`}>
            <Link
              to={categoryTransactionsHref(month, category)}
              className="flex h-10 items-center gap-2.5 rounded-control px-3 text-body-sm font-medium transition-colors duration-(--duration-fast) hover:bg-accent"
            >
              <Receipt className="size-4 text-muted-foreground" aria-hidden="true" />
              Ver lançamentos
            </Link>
            <PopoverClose asChild>
              <button
                type="button"
                onClick={onRemove}
                className="flex h-10 cursor-pointer items-center gap-2.5 rounded-control px-3 text-left text-body-sm font-medium text-destructive transition-colors duration-(--duration-fast) hover:bg-accent"
              >
                <Trash className="size-4" aria-hidden="true" />
                Excluir
              </button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  )
}

/** 6 cards na altura final (88px). */
function CategoriesSkeleton() {
  return (
    <LoadingRegion label="Carregando as categorias">
      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="surface flex min-h-22 items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-2/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
