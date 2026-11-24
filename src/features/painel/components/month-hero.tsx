import { formatBrl } from '@/domain/money'
import { capitalize, monthName } from '@/domain/month'
import { useDashboardActions } from '@/features/painel/actions-context'
import { MonthRuler } from '@/features/painel/components/month-ruler'
import { formatDayShort, formatPercent, isoOfDay } from '@/features/painel/format'
import { monthHeadline, type ComparisonCopy, type DashboardInsights } from '@/features/painel/insights'
import { budgetsLink } from '@/features/painel/links'
import type { DashboardModel } from '@/features/painel/model'
import { useCountUp } from '@/features/painel/motion'
import { RULER_TONE_BG, rulerReading } from '@/features/painel/ruler'
import { Amount } from '@/shared/components/amount'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CalendarDays, CircleAlert, PiggyBank, TrendingDown, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

/**
  Destaque do mês + régua (spec 4.2). O `h1` é o próprio destaque ("Sobram R$ 2.340,00");
  o número conta até o valor (uma vez por sessão a partir do zero; depois, do valor anterior)
  e o leitor de tela recebe só o valor final.
*/
export function MonthHero({
  model,
  insights,
  copy,
  activeDay,
  onActiveDayChange,
  firstOpen,
}: {
  model: DashboardModel
  insights: DashboardInsights
  copy: ComparisonCopy
  activeDay: number | null
  onActiveDayChange: (day: number | null) => void
  firstOpen: boolean
}) {
  const actions = useDashboardActions()
  const name = monthName(model.month)
  const headline = monthHeadline(model, insights)
  const shown = useCountUp(headline.value, { fromZero: firstOpen })
  const base = rulerReading(model, insights, null)
  const reading = activeDay === null ? base : rulerReading(model, insights, activeDay)
  const hasIncome = model.income > 0

  const lead = insights.isFuture
    ? `${capitalize(name)} ainda não começou. Dá para deixar as metas prontas.`
    : hasIncome
      ? `Em ${name} entraram ${formatBrl(model.income)} e ${insights.isPast ? 'saíram' : 'já saíram'} ${formatBrl(model.expense)}.`
      : model.expense > 0
        ? `Ainda não há receita lançada em ${name}.`
        : `Nada lançado em ${name} ainda.`

  return (
    <section className="grid gap-6" aria-labelledby="painel-destaque">
      <div className="grid gap-3">
        <p className="eyebrow">{headline.label}</p>
        <h1 id="painel-destaque" className="font-sans">
          <span className="sr-only">
            {headline.verb} {formatBrl(headline.value)}
          </span>
          <span aria-hidden="true" className="numeral-hero flex flex-wrap items-baseline gap-x-[0.28em]">
            <span className="text-[0.42em] font-medium tracking-tight text-muted-foreground">{headline.verb}</span>
            <Amount value={shown} className={cn(headline.negative && 'text-expense')} minorClassName="opacity-50" />
          </span>
        </h1>
        <p className="max-w-2xl text-body text-muted-foreground sm:text-lead">
          {lead}
          {insights.isFuture ? (
            <>
              {' '}
              <Link to={budgetsLink(model.month)} className="font-semibold text-brand underline-offset-4 hover:underline">
                Definir metas
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-3">
        <MonthRuler
          reading={reading}
          hasIncome={hasIncome}
          animate={firstOpen}
          onCursorChange={onActiveDayChange}
          onOpenDay={(day) => actions.openDay(isoOfDay(model.month, day))}
        />
        <RulerReadout model={model} insights={insights} reading={reading} copy={copy} />
        <Verdict model={model} insights={insights} tone={base.tone} />
      </div>
    </section>
  )
}

function RulerReadout({
  model,
  insights,
  reading,
  copy,
}: {
  model: DashboardModel
  insights: DashboardInsights
  reading: ReturnType<typeof rulerReading>
  copy: ComparisonCopy
}) {
  const hasIncome = model.income > 0
  if (insights.isFuture) return null

  if (reading.hasCursor) {
    const date = formatDayShort(isoOfDay(model.month, reading.day))
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-body-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn('size-2 rounded-full', RULER_TONE_BG[reading.tone])} aria-hidden="true" />
          Até {date}: saíram {formatBrl(reading.spent)}
          {hasIncome ? `, ${formatPercent(reading.share ?? 0)} da receita` : ''}
        </span>
        {reading.comparisonSpent !== null ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-3 w-0.5 rounded-full bg-chart-muted" aria-hidden="true" />
            {copy.untilDay} {reading.day}: {formatBrl(reading.comparisonSpent)}
          </span>
        ) : null}
      </div>
    )
  }

  if (!hasIncome) {
    return <p className="text-body-sm text-muted-foreground">Ainda não há receita lançada em {monthName(model.month)}.</p>
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-body-sm">
      <span className="flex items-center gap-2 font-medium">
        <span className={cn('size-2 rounded-full', RULER_TONE_BG[reading.tone])} aria-hidden="true" />
        {insights.isPast ? 'Saiu' : 'Já saiu'} {formatPercent(reading.share ?? 0)} da receita
      </span>
      {insights.isCurrentMonth ? (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Dia {insights.daysElapsed} de {insights.totalDays}
        </span>
      ) : null}
      {reading.overBy !== null ? (
        <span className="flex items-center gap-1.5 font-semibold text-expense">
          <CircleAlert className="size-3.5" aria-hidden="true" />
          Passou {formatBrl(reading.overBy)} da receita
        </span>
      ) : reading.comparisonShare !== null ? (
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="h-3 w-0.5 rounded-full bg-chart-muted" aria-hidden="true" />
          {copy.sameDay}: {formatPercent(reading.comparisonShare)}
        </span>
      ) : null}
    </div>
  )
}

function Verdict({
  model,
  insights,
  tone,
}: {
  model: DashboardModel
  insights: DashboardInsights
  tone: 'primary' | 'warning' | 'expense'
}) {
  const actions = useDashboardActions()
  if (insights.isFuture) return null

  if (model.income <= 0) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-body text-muted-foreground">
        Lancem a receita do mês para ver quanto ainda sobra.
        <Button
          variant="link"
          size="sm"
          disabled={!actions.canAdd}
          onClick={() => actions.newTransaction({ kind: 'income' })}
        >
          Lançar receita
        </Button>
      </p>
    )
  }

  let verdict: { text: string; icon: LucideIcon; className: string }
  if (tone === 'expense') {
    verdict = { text: 'Os gastos já passaram do que entrou neste mês.', icon: CircleAlert, className: 'text-expense' }
  } else if (!insights.isCurrentMonth) {
    if (model.savingsPercent === null) return null
    verdict = { text: `Vocês guardaram ${model.savingsPercent}% do que entrou.`, icon: PiggyBank, className: 'text-brand' }
  } else if (tone === 'warning') {
    verdict = {
      text: 'O gasto está na frente do calendário. Vale segurar um pouco até o fim do mês.',
      icon: TriangleAlert,
      className: 'text-warning',
    }
  } else {
    verdict = { text: 'O gasto está atrás do calendário. Dá para respirar.', icon: TrendingDown, className: 'text-brand' }
  }
  const Icon = verdict.icon
  return (
    <p className={cn('flex items-start gap-2 text-body font-medium', verdict.className)}>
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      {verdict.text}
    </p>
  )
}
