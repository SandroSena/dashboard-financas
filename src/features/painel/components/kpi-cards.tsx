import { formatBrl } from '@/domain/money'
import { STATUS_LABEL } from '@/features/orcamentos/model'
import { statusTone } from '@/features/orcamentos/status-tone'
import { Sparkline } from '@/features/painel/charts/sparkline'
import { plural } from '@/features/painel/format'
import type { ComparisonCopy, DashboardInsights } from '@/features/painel/insights'
import { budgetsLink, transactionsLink } from '@/features/painel/links'
import type { DashboardModel, MonthPoint } from '@/features/painel/model'
import { Amount } from '@/shared/components/amount'
import { Delta } from '@/shared/components/delta'
import { describeDelta } from '@/shared/components/delta-format'
import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/ui/progress'
import { ChevronRight, PiggyBank, Target, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

const progressTone = { ok: 'income', warning: 'warning', over: 'expense' } as const

/**
  Faixa de indicadores (spec 4.3, design system 10.10). Cada card é um link inteiro, com
  `aria-label` que resume valor, variação e destino.
*/
export function KpiStrip({
  model,
  insights,
  copy,
  months,
  budgetsFailed,
  animateBars,
}: {
  model: DashboardModel
  insights: DashboardInsights
  copy: ComparisonCopy
  /** Meses da janela (6 ou 12) para as minitendências. */
  months: MonthPoint[]
  budgetsFailed: boolean
  animateBars: boolean
}) {
  const month = model.month
  const deltaProps = { comparison: copy.phrase, label: copy.deltaLabel, emptyLabel: copy.emptyLabel }
  const srDelta = (value: number | null, unit: 'percent' | 'money', goodWhen: 'up' | 'down') =>
    value === null ? copy.emptyLabel : describeDelta(value, unit, goodWhen, copy.phrase).srText

  return (
    <section aria-label="Indicadores do mês" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiCard
        to={transactionsLink(month, { kind: 'income' })}
        label="Receitas"
        ariaLabel={`Receitas: ${formatBrl(model.income)}, ${srDelta(insights.incomeChange, 'percent', 'up')}. Ver lançamentos de receita.`}
        icon={TrendingUp}
        iconClass="bg-income-soft text-income"
        value={<Amount value={model.income} />}
        delta={<Delta value={insights.incomeChange} unit="percent" goodWhen="up" {...deltaProps} />}
        note={plural(model.incomeCount, 'lançamento', 'lançamentos')}
        trend={<Sparkline values={months.map((point) => point.income)} color="var(--income)" />}
      />
      <KpiCard
        to={transactionsLink(month, { kind: 'expense' })}
        label="Gastos"
        ariaLabel={`Gastos: ${formatBrl(model.expense)}, ${srDelta(insights.expenseChange, 'percent', 'down')}. Ver lançamentos de gasto.`}
        icon={TrendingDown}
        iconClass="bg-expense-soft text-expense"
        value={<Amount value={model.expense} />}
        delta={<Delta value={insights.expenseChange} unit="percent" goodWhen="down" {...deltaProps} />}
        note={
          model.expenseCount > 0
            ? `${plural(model.expenseCount, 'lançamento', 'lançamentos')}, média de ${formatBrl(model.averageExpense)}`
            : plural(0, 'lançamento', 'lançamentos')
        }
        trend={<Sparkline values={months.map((point) => point.expense)} color="var(--expense)" />}
      />
      <KpiCard
        to={transactionsLink(month)}
        label="Saldo"
        ariaLabel={`Saldo: ${formatBrl(model.balance)}, ${srDelta(insights.balanceChange, 'money', 'up')}. Ver lançamentos do mês.`}
        icon={PiggyBank}
        iconClass="bg-brand-soft text-brand"
        value={<Amount value={model.balance} className={cn(model.balance < 0 && 'text-expense')} />}
        delta={<Delta value={insights.balanceChange} unit="money" goodWhen="up" {...deltaProps} />}
        note={
          model.savingsPercent === null
            ? 'Sem receita lançada'
            : model.savingsPercent >= 0
              ? `Guardaram ${model.savingsPercent}% da receita`
              : 'Gastaram mais do que entrou'
        }
        trend={<Sparkline values={months.map((point) => point.balance)} color="var(--brand)" />}
      />
      <BudgetKpi model={model} insights={insights} failed={budgetsFailed} animate={animateBars} />
    </section>
  )
}

function KpiCard({
  to,
  label,
  ariaLabel,
  icon: Icon,
  iconClass,
  value,
  delta,
  note,
  trend,
}: {
  to: string
  label: string
  ariaLabel: string
  icon: LucideIcon
  iconClass: string
  value: ReactNode
  delta: ReactNode
  note: ReactNode
  trend: ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="surface surface-interactive group relative grid min-w-0 content-start gap-3 rounded-card p-4 sm:p-5"
    >
      <span className="flex items-center justify-between gap-2" aria-hidden="true">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-control', iconClass)}>
            <Icon className="size-3.5" />
          </span>
          <span className="eyebrow truncate">{label}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100" />
      </span>
      <span className="grid gap-1.5" aria-hidden="true">
        <span className="figure truncate text-title leading-none font-semibold lg:text-heading">{value}</span>
        {delta}
      </span>
      <span className="hidden min-[400px]:block" aria-hidden="true">
        {trend}
      </span>
      <span className="line-clamp-2 text-caption text-muted-foreground" aria-hidden="true">
        {note}
      </span>
    </Link>
  )
}

function BudgetKpi({
  model,
  insights,
  failed,
  animate,
}: {
  model: DashboardModel
  insights: DashboardInsights
  failed: boolean
  animate: boolean
}) {
  const { overall } = model
  const to = budgetsLink(model.month)

  if (failed || overall.limit === 0) {
    return (
      <KpiCard
        to={to}
        label="Metas"
        ariaLabel={failed ? 'Metas: as metas não carregaram. Abrir Orçamentos.' : 'Metas: nenhum limite no mês. Definir metas.'}
        icon={Target}
        iconClass="bg-muted text-muted-foreground"
        value={<span className="text-muted-foreground">—</span>}
        delta={<span className="text-caption text-muted-foreground">{failed ? 'Não carregou' : 'Nenhum limite no mês'}</span>}
        note={failed ? 'Tentem de novo no card de metas.' : <span className="font-semibold text-brand">Definir metas</span>}
        trend={<div className="h-10" />}
      />
    )
  }

  const tone = statusTone[overall.status]
  const StatusIcon = tone.icon
  const note =
    insights.remainingBudget !== null && insights.remainingBudget < 0
      ? `Passou ${formatBrl(-insights.remainingBudget)} do limite`
      : insights.dailyAllowance !== null
        ? `Cabem ${formatBrl(insights.dailyAllowance)}/dia até o fim do mês`
        : `${formatBrl(overall.spent)} de ${formatBrl(overall.limit)}`

  return (
    <KpiCard
      to={to}
      label="Metas"
      ariaLabel={`Metas: ${overall.percent}% usado, ${STATUS_LABEL[overall.status]}. ${note}. Ver orçamentos.`}
      icon={Target}
      iconClass={cn(
        overall.status === 'over' ? 'bg-expense-soft' : overall.status === 'warning' ? 'bg-warning-soft' : 'bg-income-soft',
        tone.text,
      )}
      value={
        <>
          {overall.percent}
          <span className="ml-0.5 text-[0.55em] opacity-60">% usado</span>
        </>
      }
      delta={
        <span className={cn('flex items-center gap-1 text-caption font-semibold', tone.text)}>
          <StatusIcon className="size-3.5" />
          {STATUS_LABEL[overall.status]}
        </span>
      }
      note={note}
      trend={
        <div className="flex h-10 items-center">
          <Progress value={Math.min(overall.percent, 100)} tone={progressTone[overall.status]} animateOnMount={animate} />
        </div>
      }
    />
  )
}
