import { formatBrl } from '@/domain/money'
import { monthLabel } from '@/domain/month'
import { budgetStatusLabel } from '@/domain/summary'
import { Sparkline } from '@/features/painel/charts'
import { formatPercent } from '@/features/painel/format'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { statusTone } from '@/features/painel/components/status-tone'
import { MoneyText } from '@/shared/components/money-text'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Plus, Target, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

export function EmptyMonth({ month, onAdd }: { month: string; onAdd: () => void }) {
  return (
    <Card className="fade-up border-dashed bg-brand/5">
      <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="font-medium">Nada lançado em {monthLabel(month).toLowerCase()}</p>
            <p className="text-sm text-muted-foreground">
              Adicione receitas e gastos para ver o saldo, o ritmo do mês e as metas ganharem vida.
            </p>
          </div>
        </div>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={onAdd}>
          <Plus className="size-4" />
          Adicionar lançamento
        </Button>
      </CardContent>
    </Card>
  )
}

export function BalanceHero({
  model,
  insights,
  previousLabel,
}: {
  model: DashboardModel
  insights: DashboardInsights
  previousLabel: string
}) {
  const flowTotal = model.income + model.expense
  const spentShare = model.income > 0 ? Math.min(model.expense / model.income, 1) : model.expense > 0 ? 1 : 0
  const positive = model.balance >= 0

  return (
    <Card className="relative overflow-hidden md:col-span-2 xl:col-span-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-brand/10 blur-3xl"
      />
      <CardContent className="relative flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
              <Wallet className="size-4" />
            </span>
            Saldo do mês
          </p>
          {model.savingsPercent !== null ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                positive ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense',
              )}
            >
              {positive ? `Guardou ${model.savingsPercent}%` : 'Gastou mais do que entrou'}
            </span>
          ) : null}
        </div>
        <div>
          <p className={cn('text-4xl font-semibold tracking-tight', positive ? 'text-foreground' : 'text-expense')}>
            {formatBrl(model.balance)}
          </p>
          <ChangeText
            className="mt-1"
            value={insights.balanceChange}
            format={(value) => formatBrl(Math.abs(value))}
            goodWhen="up"
            previousLabel={previousLabel}
          />
        </div>
        <div className="mt-auto grid gap-2">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            {flowTotal > 0 ? (
              <>
                <span className="h-full rounded-l-full bg-expense" style={{ width: `${spentShare * 100}%` }} />
                {spentShare < 1 ? <span className="h-full flex-1 rounded-r-full bg-income" /> : null}
              </>
            ) : null}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Gastou <span className="font-medium text-foreground">{formatPercent(spentShare)}</span> do que entrou
            </span>
            <span>
              Sobra <MoneyText value={Math.max(model.balance, 0)} className="font-medium text-foreground" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChangeText({
  value,
  format,
  goodWhen,
  previousLabel,
  className,
}: {
  value: number | null
  format: (value: number) => string
  goodWhen: 'up' | 'down'
  previousLabel: string
  className?: string
}) {
  if (value === null) {
    return <p className={cn('text-xs text-muted-foreground', className)}>Sem dados de {previousLabel} para comparar</p>
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  const good = value === 0 ? null : goodWhen === 'up' ? value > 0 : value < 0
  return (
    <p className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium',
          good === true && 'text-income',
          good === false && 'text-expense',
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {value > 0 ? '+' : value < 0 ? '−' : ''}
        {format(value)}
      </span>
      vs. {previousLabel}
    </p>
  )
}

export function KpiTile({
  label,
  icon: Icon,
  tone,
  value,
  hint,
  change,
  goodWhen,
  previousLabel,
  spark,
}: {
  label: string
  icon: LucideIcon
  tone: 'income' | 'expense'
  value: number
  hint: string
  change: number | null
  goodWhen: 'up' | 'down'
  previousLabel: string
  spark: number[]
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-md',
              tone === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{formatBrl(value)}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="mt-auto grid gap-1">
          <Sparkline values={spark} color={tone === 'income' ? 'var(--income)' : 'var(--expense)'} />
          <ChangeText value={change} format={(v) => `${Math.abs(v)}%`} goodWhen={goodWhen} previousLabel={previousLabel} />
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetTile({ model, insights, month }: { model: DashboardModel; insights: DashboardInsights; month: string }) {
  const { overall } = model
  if (overall.limit === 0) {
    return (
      <Card>
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Metas</p>
            <span className="flex size-7 items-center justify-center rounded-md bg-muted">
              <Target className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Defina um limite por categoria e acompanhe aqui quanto ainda cabe no mês.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-auto self-start">
            <Link to={`/orcamentos?mes=${month}`}>
              Criar metas
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const tone = statusTone[overall.status]
  const StatusIcon = tone.icon
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Metas</p>
          <span className={cn('flex items-center gap-1 text-xs font-medium', tone.text)}>
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {budgetStatusLabel(overall.status)}
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{overall.percent}%</p>
          <p className="text-xs text-muted-foreground">
            {formatBrl(overall.spent)} de {formatBrl(overall.limit)}
          </p>
        </div>
        <div className="mt-auto grid gap-2">
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.min(overall.percent, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Uso das metas do mês"
          >
            <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${Math.min(overall.percent, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.remainingBudget !== null && insights.remainingBudget < 0 ? (
              <>Passou {formatBrl(-insights.remainingBudget)} do limite</>
            ) : insights.dailyAllowance !== null ? (
              <>
                Pode gastar <span className="font-medium text-foreground">{formatBrl(insights.dailyAllowance)}/dia</span> até o
                fim do mês
              </>
            ) : (
              <>Restam {formatBrl(Math.max(insights.remainingBudget ?? 0, 0))}</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
