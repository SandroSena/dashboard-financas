import { formatBrl } from '@/domain/money'
import { budgetStatusLabel } from '@/domain/summary'
import { Sparkline } from '@/features/painel/charts'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { statusTone } from '@/features/orcamentos/status-tone'
import { Amount } from '@/shared/components/amount'
import { cn } from '@/shared/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Minus,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
  Faixa de indicadores logo abaixo do destaque do mês. Cada card segue o mesmo contrato:
  rótulo, valor, variação contra o mês anterior (sinal + seta, nunca só cor), uma linha
  de contexto e a tendência dos últimos 6 meses. O card inteiro leva ao detalhe.
*/
export function KpiStrip({
  model,
  insights,
  previousLabel,
  month,
}: {
  model: DashboardModel
  insights: DashboardInsights
  previousLabel: string
  month: string
}) {
  const months = model.months
  const plural = (count: number) => `${count} ${count === 1 ? 'lançamento' : 'lançamentos'}`

  return (
    <section aria-label="Indicadores do mês" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiCard
        to={`/lancamentos?mes=${month}`}
        icon={TrendingUp}
        iconClass="bg-income-soft text-income"
        label="Receitas"
        value={<Amount value={model.income} />}
        delta={<Delta value={insights.incomeChange} unit="percent" goodWhen="up" previousLabel={previousLabel} />}
        note={plural(model.incomeCount)}
        trend={<Sparkline values={months.map((point) => point.income)} color="var(--income)" />}
      />
      <KpiCard
        to={`/lancamentos?mes=${month}`}
        icon={TrendingDown}
        iconClass="bg-expense-soft text-expense"
        label="Gastos"
        value={<Amount value={model.expense} />}
        delta={<Delta value={insights.expenseChange} unit="percent" goodWhen="down" previousLabel={previousLabel} />}
        note={
          model.expenseCount > 0
            ? `${plural(model.expenseCount)} · média de ${formatBrl(model.averageExpense)}`
            : plural(0)
        }
        trend={<Sparkline values={months.map((point) => point.expense)} color="var(--expense)" />}
      />
      <KpiCard
        to={`/lancamentos?mes=${month}`}
        icon={PiggyBank}
        iconClass="bg-brand-soft text-brand"
        label="Saldo"
        value={<Amount value={model.balance} className={cn(model.balance < 0 && 'text-expense')} />}
        delta={<Delta value={insights.balanceChange} unit="money" goodWhen="up" previousLabel={previousLabel} />}
        note={
          model.savingsPercent === null
            ? 'Sem receita lançada'
            : model.savingsPercent >= 0
              ? `Guardaram ${model.savingsPercent}% da receita`
              : 'Gastaram mais do que entrou'
        }
        trend={<Sparkline values={months.map((point) => point.balance)} color="var(--brand)" />}
      />
      <BudgetKpi model={model} insights={insights} month={month} />
    </section>
  )
}

function KpiCard({
  to,
  icon: Icon,
  iconClass,
  label,
  value,
  delta,
  note,
  trend,
}: {
  to: string
  icon: LucideIcon
  iconClass: string
  label: string
  value: ReactNode
  delta?: ReactNode
  note: ReactNode
  trend: ReactNode
}) {
  return (
    <Link
      to={to}
      className="surface group relative grid min-w-0 content-start gap-3 p-4 transition-[transform,box-shadow] duration-300 ease-fluid hover:-translate-y-0.5 hover:shadow-[var(--card-edge),0_14px_32px_-18px_rgb(0_0_0/0.35)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', iconClass)} aria-hidden="true">
            <Icon className="size-3.5" />
          </span>
          <span className="eyebrow truncate">{label}</span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-1.5">
        <p className="figure truncate text-[1.375rem] leading-none font-semibold sm:text-[1.75rem]">{value}</p>
        {delta}
      </div>

      {trend}

      <p className="line-clamp-2 text-xs text-muted-foreground">{note}</p>
    </Link>
  )
}

/** Variação contra o mês anterior: pílula com seta e sinal; a cor diz se é bom ou ruim. */
function Delta({
  value,
  unit,
  goodWhen,
  previousLabel,
}: {
  value: number | null
  unit: 'percent' | 'money'
  goodWhen: 'up' | 'down'
  previousLabel: string
}) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">Sem {previousLabel} para comparar</span>
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  const good = value === 0 ? null : goodWhen === 'up' ? value > 0 : value < 0
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  const amount = unit === 'percent' ? `${Math.abs(value)}%` : formatBrl(Math.abs(value))

  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          'figure inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
          good === true && 'bg-income-soft text-income',
          good === false && 'bg-expense-soft text-expense',
          good === null && 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {sign}
        {amount}
      </span>
      <span className="truncate">vs {previousLabel}</span>
    </span>
  )
}

function BudgetKpi({ model, insights, month }: { model: DashboardModel; insights: DashboardInsights; month: string }) {
  const { overall } = model
  const to = `/orcamentos?mes=${month}`

  if (overall.limit === 0) {
    return (
      <KpiCard
        to={to}
        icon={Target}
        iconClass="bg-muted text-muted-foreground"
        label="Metas"
        value={<span className="text-muted-foreground">—</span>}
        delta={<span className="text-xs text-muted-foreground">Nenhum limite no mês</span>}
        note={<span className="font-semibold text-brand">Definir metas</span>}
        trend={<div className="h-10" aria-hidden="true" />}
      />
    )
  }

  const tone = statusTone[overall.status]
  const StatusIcon = tone.icon
  const used = Math.min(overall.percent, 100)

  return (
    <KpiCard
      to={to}
      icon={Target}
      iconClass="bg-warning-soft text-warning"
      label="Metas"
      value={
        <>
          {overall.percent}
          <span className="ml-0.5 text-[0.55em] opacity-60">% usado</span>
        </>
      }
      delta={
        <span className={cn('flex items-center gap-1 text-xs font-semibold', tone.text)}>
          <StatusIcon className="size-3.5" aria-hidden="true" />
          {budgetStatusLabel(overall.status)}
        </span>
      }
      note={
        insights.remainingBudget !== null && insights.remainingBudget < 0 ? (
          <>Passou {formatBrl(-insights.remainingBudget)} do limite</>
        ) : insights.dailyAllowance !== null ? (
          <>
            Cabem <span className="font-semibold text-foreground">{formatBrl(insights.dailyAllowance)}/dia</span> até o fim do mês
          </>
        ) : (
          <>
            {formatBrl(overall.spent)} de {formatBrl(overall.limit)}
          </>
        )
      }
      trend={
        <div className="flex h-10 items-center" aria-hidden="true">
          <div className="h-2 w-full overflow-hidden rounded-full bg-track">
            <div className={cn('fill-in h-full rounded-full', tone.bar)} style={{ width: `${used}%` }} />
          </div>
        </div>
      }
    />
  )
}
