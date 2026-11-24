import { formatBrl } from '@/domain/money'
import { monthLabel } from '@/domain/month'
import type { Transaction } from '@/domain/types'
import { TransactionDialog } from '@/features/lancamentos/transaction-dialog'
import {
  DashboardActionsContext,
  type DashboardActions,
  type NewTransactionDefaults,
} from '@/features/painel/actions-context'
import { useAnnounce } from '@/features/painel/announce-context'
import { AnnouncerProvider } from '@/features/painel/announcer'
import type { PaceVisibility } from '@/features/painel/charts/spending-pace'
import { BreakdownCard } from '@/features/painel/components/breakdown-card'
import { BudgetsCard } from '@/features/painel/components/budgets-card'
import { CalendarCard } from '@/features/painel/components/calendar-card'
import { CategorySheet } from '@/features/painel/components/category-sheet'
import { DashboardHeader } from '@/features/painel/components/dashboard-header'
import { DaySheet } from '@/features/painel/components/day-sheet'
import { EmptyMonth } from '@/features/painel/components/empty-month'
import { EvolutionCard } from '@/features/painel/components/evolution-card'
import { HighlightsCard } from '@/features/painel/components/highlights-card'
import { KpiStrip } from '@/features/painel/components/kpi-cards'
import { MonthHero } from '@/features/painel/components/month-hero'
import { PACE_CARD_ID, PaceCard } from '@/features/painel/components/pace-card'
import { RecentCard } from '@/features/painel/components/recent-card'
import { buildCategoryDetail, buildDayDetail, type CategoryDetail, type DayDetail } from '@/features/painel/detail'
import {
  useDashboardData,
  useDashboardModel,
  useDashboardParams,
  usePrefetchDashboard,
  type DashboardData,
} from '@/features/painel/hooks'
import { comparisonCopy, monthHeadline, type DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { useFirstOpenInSession } from '@/features/painel/motion'
import { isDayOfMonth } from '@/features/painel/params'
import { DashboardSkeleton, EmptyState, QueryError } from '@/shared/components/feedback'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { loadErrorText } from '@/shared/lib/error-copy'
import { NO_FLASH, nextFlash, type RowFlashMark } from '@/shared/lib/row-flash'
import { errorCode, errorMessage } from '@/shared/lib/supabase'
import { toastMissingCategory } from '@/shared/lib/toast-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Shapes } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

/** Orientação do erro de carga, quando a mensagem do repository ainda não orienta (UX-44). */
const LOAD_ERROR_HINT = 'Confiram a conexão e tentem de novo.'

/** Painel (`/painel`), spec em `docs/design/telas/painel.md`. */
export function DashboardPage() {
  useEffect(() => {
    document.title = 'Painel | Finanças'
  }, [])
  return (
    <AnnouncerProvider>
      <DashboardScreen />
    </AnnouncerProvider>
  )
}

function DashboardScreen() {
  const { month } = useMonthParam()
  const params = useDashboardParams()
  const data = useDashboardData(month)
  const prefetch = usePrefetchDashboard()
  const announce = useAnnounce()
  const { model, insights } = useDashboardModel(data, params.compare)
  const ready = !data.isLoading && !data.error

  const spendByMonth = useMemo(() => {
    if (!ready) return undefined
    const peak = model.months.reduce((max, point) => Math.max(max, point.expense), 0)
    return Object.fromEntries(model.months.map((point) => [point.key, peak > 0 ? point.expense / peak : 0]))
  }, [model.months, ready])

  return (
    <div className="grid gap-8 md:gap-12">
      <DashboardHeader
        compare={params.compare}
        onCompareChange={(next) => {
          params.setCompare(next)
          announce(comparisonCopy(next, month).announcement)
        }}
        onPrefetch={prefetch}
        spendByMonth={spendByMonth}
      />
      {/* Nos estados sem conteúdo, o `h1` do destaque não existe: este mantém o título da página. */}
      {data.isLoading || data.error || data.categories.length === 0 ? <h1 className="sr-only">Painel</h1> : null}
      {data.isLoading ? (
        <DashboardSkeleton />
      ) : data.error ? (
        <QueryError
          title="Não foi possível carregar o painel."
          message={loadErrorText(errorMessage(data.error), LOAD_ERROR_HINT, errorCode(data.error))}
          onRetry={data.retry}
        />
      ) : data.categories.length === 0 ? (
        <EmptyState
          icon={<Shapes />}
          title="Comecem pelas categorias"
          description="Elas separam o que entra e o que sai, como Mercado, Aluguel e Salário. Depois é só lançar."
          action={
            <Button asChild>
              <Link to="/categorias">Criar categorias</Link>
            </Button>
          }
        />
      ) : (
        <DashboardContent data={data} model={model} insights={insights} params={params} />
      )}
    </div>
  )
}

type DialogState =
  | { mode: 'edit'; transaction: Transaction; key: number }
  | { mode: 'new'; defaults: NewTransactionDefaults; key: number }
  | null

const ALL_SERIES: PaceVisibility = { current: true, projected: true, comparison: true }

function DashboardContent({
  data,
  model,
  insights,
  params,
}: {
  data: DashboardData
  model: DashboardModel
  insights: DashboardInsights
  params: ReturnType<typeof useDashboardParams>
}) {
  const { setMonth } = useMonthParam()
  const announce = useAnnounce()
  const reducedMotion = usePrefersReducedMotion()
  const firstOpen = useFirstOpenInSession()
  const month = model.month
  const copy = comparisonCopy(params.compare, month)

  // Cursor de dia compartilhado entre a régua e o ritmo; volta para hoje ao trocar de mês.
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [cursorMonth, setCursorMonth] = useState(month)
  if (cursorMonth !== month) {
    setCursorMonth(month)
    setActiveDay(null)
  }

  const [paceVisible, setPaceVisible] = useState<PaceVisibility>(ALL_SERIES)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [flash, setFlash] = useState<RowFlashMark>(NO_FLASH)
  const [dayHighlight, setDayHighlight] = useState<string | null>(null)
  const dialogKey = useRef(0)

  const actions: DashboardActions = {
    openCategory: (id) => params.openCategory(id),
    openDay: (date, highlightId) => {
      setDayHighlight(highlightId ?? null)
      params.openDay(date)
    },
    editTransaction: (transaction) => setDialog({ mode: 'edit', transaction, key: ++dialogKey.current }),
    newTransaction: (defaults = {}) => {
      if (data.categoriesReady) setDialog({ mode: 'new', defaults, key: ++dialogKey.current })
    },
    canAdd: data.categoriesReady,
    flash,
  }

  // Folhas (estado na URL). Categoria inexistente: a folha não abre, sai da URL e um aviso explica (UX-30).
  const categoryDetail = useMemo(
    () => (params.category ? buildCategoryDetail(params.category, model, insights, params.window) : null),
    [insights, model, params.category, params.window],
  )
  const dayDetail = useMemo(
    () => (params.day && isDayOfMonth(params.day, month) ? buildDayDetail(params.day, model, insights) : null),
    [insights, model, month, params.day],
  )
  const { dropSheetParam } = params
  const invalidCategory = params.category !== null && categoryDetail === null && data.categoriesReady && !data.switching
  const invalidDay = params.day !== null && dayDetail === null && !data.switching
  useEffect(() => {
    if (invalidCategory) {
      toastMissingCategory()
      dropSheetParam()
    } else if (invalidDay) {
      dropSheetParam()
    }
  }, [dropSheetParam, invalidCategory, invalidDay])

  // A folha guarda o último conteúdo enquanto a animação de saída roda.
  const [shownCategory, setShownCategory] = useState<CategoryDetail | null>(categoryDetail)
  if (categoryDetail && categoryDetail !== shownCategory) setShownCategory(categoryDetail)
  const [shownDay, setShownDay] = useState<DayDetail | null>(dayDetail)
  if (dayDetail && dayDetail !== shownDay) setShownDay(dayDetail)

  // Região viva: "Painel de outubro de 2026: sobraram R$ 1.800,00" ao trocar de mês.
  const announcedMonth = useRef(month)
  const headline = monthHeadline(model, insights)
  useEffect(() => {
    if (announcedMonth.current === month) return
    announcedMonth.current = month
    announce(`Painel de ${monthLabel(month).toLowerCase()}: ${headline.verb.toLowerCase()} ${formatBrl(headline.value)}`)
  }, [announce, headline.value, headline.verb, month])

  const windowMonths = model.months.slice(-params.window)
  const isEmpty = model.transactions.length === 0
  const budgetsError = data.budgetsError ? errorMessage(data.budgetsError) : null

  function selectMonthFromChart(key: string) {
    setMonth(key)
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  function showProjection() {
    setPaceVisible((current) => ({ ...current, projected: true }))
    const card = document.getElementById(PACE_CARD_ID)
    card?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    card?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  return (
    <DashboardActionsContext.Provider value={actions}>
      <div
        className={cn('grid gap-8 transition-opacity duration-(--duration-base) md:gap-12', data.switching && 'opacity-60')}
        aria-busy={data.switching || undefined}
      >
        {isEmpty && !insights.isFuture ? (
          <EmptyMonth month={month} onAdd={() => actions.newTransaction()} disabled={!data.categoriesReady} />
        ) : null}

        <div className="grid gap-8">
          <div className="relative grid gap-6">
            <SwitchingBar active={data.switching} />
            <MonthHero
              model={model}
              insights={insights}
              copy={copy}
              activeDay={activeDay}
              onActiveDayChange={setActiveDay}
              firstOpen={firstOpen}
            />
          </div>
          <KpiStrip
            model={model}
            insights={insights}
            copy={copy}
            months={windowMonths}
            budgetsFailed={budgetsError !== null}
            animateBars={firstOpen}
          />
        </div>

        {/*
          Uma só ordem para todas as larguras (UX-48/49), sem `order-*`: o DOM é a ordem de
          leitura e de Tab. xl (12 colunas): [Para onde foi 4 | Ritmo 8], [Metas 4 | Recentes 4 |
          Dias 4], [Evolução 8 | Destaques 4]. lg (2 colunas): Para onde foi e Ritmo em largura
          total, Metas | Recentes, Dias | Evolução, Destaques em largura total.
        */}
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-12">
          <BreakdownCard insights={insights} copy={copy} className="lg:col-span-2 xl:col-span-4" />
          <PaceCard
            model={model}
            insights={insights}
            copy={copy}
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            visible={paceVisible}
            onVisibleChange={setPaceVisible}
            className="lg:col-span-2 xl:col-span-8"
          />
          <div className="grid xl:col-span-4">
            <BudgetsCard
              usage={model.usage}
              month={month}
              insights={insights}
              error={budgetsError}
              onRetry={data.retryBudgets}
              animate={firstOpen}
            />
          </div>
          <div className="grid xl:col-span-4">
            <RecentCard transactions={model.recent} categoryById={model.categoryById} month={month} />
          </div>
          <CalendarCard model={model} insights={insights} className="xl:col-span-4" />
          <EvolutionCard
            months={windowMonths}
            activeKey={month}
            window={params.window}
            onWindowChange={params.setWindow}
            onSelectMonth={selectMonthFromChart}
            className="xl:col-span-8"
          />
          <div className="grid lg:col-span-2 xl:col-span-4">
            <HighlightsCard model={model} insights={insights} copy={copy} onShowProjection={showProjection} />
          </div>
        </div>
      </div>

      <CategorySheet
        detail={shownCategory}
        open={categoryDetail !== null}
        onClose={params.closeSheet}
        month={month}
        copy={copy}
        hasComparison={insights.comparison !== null}
        onSelectMonth={setMonth}
      />
      <DaySheet
        detail={shownDay}
        open={dayDetail !== null}
        onClose={params.closeSheet}
        month={month}
        categoryById={model.categoryById}
        highlightId={dayHighlight}
      />

      {dialog ? (
        <TransactionDialog
          key={dialog.key}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          month={month}
          categories={data.categories}
          transaction={dialog.mode === 'edit' ? dialog.transaction : null}
          defaultDate={dialog.mode === 'new' ? dialog.defaults.date : undefined}
          defaultKind={dialog.mode === 'new' ? dialog.defaults.kind : undefined}
          defaultCategoryId={dialog.mode === 'new' ? dialog.defaults.categoryId : undefined}
          onSaved={(saved, mode) => {
            if (mode === 'updated') setFlash((current) => nextFlash(current, saved.id))
          }}
        />
      ) : null}
    </DashboardActionsContext.Provider>
  )
}

/** Barra fina no topo do destaque enquanto um mês sem cache carrega (UX-46). Espaço sempre reservado. */
function SwitchingBar({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-x-0 -top-4 h-0.5 overflow-hidden rounded-full" aria-hidden="true">
      {active ? <div className="progress-indeterminate h-full rounded-full bg-primary" /> : null}
    </div>
  )
}
