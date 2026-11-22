import { formatBrl } from '@/domain/money'
import { formatShortDate } from '@/domain/month'
import { budgetStatusLabel, type BudgetUsage } from '@/domain/summary'
import type { Category, Transaction } from '@/domain/types'
import { formatPercent } from '@/features/painel/format'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { CardLink, ChartEmpty } from '@/features/painel/components/card-parts'
import { statusTone } from '@/features/orcamentos/status-tone'
import { TransactionGroups } from '@/features/lancamentos/transaction-groups'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Section } from '@/shared/ui/card'
import { Lightbulb, Plus, Target } from 'lucide-react'
import type { ReactNode } from 'react'

export function HighlightsCard({ model, insights }: { model: DashboardModel; insights: DashboardInsights }) {
  const top = insights.categories[0]
  const items: Array<{ label: string; value: ReactNode; hint?: string }> = []

  if (insights.projectedExpense !== null) {
    items.push({
      label: 'Projeção de gastos no fim do mês',
      value: formatBrl(insights.projectedExpense),
      hint:
        model.income > 0
          ? insights.projectedExpense > model.income
            ? 'Nesse ritmo, os gastos passam das receitas.'
            : `Nesse ritmo, sobram ${formatBrl(model.income - insights.projectedExpense)}.`
          : 'Se o ritmo atual continuar.',
    })
  }
  if (insights.daysElapsed > 0 && model.expense > 0) {
    items.push({
      label: 'Média por dia',
      value: formatBrl(insights.dailyAverage),
      hint: `Em ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'dia' : 'dias'} do mês.`,
    })
  }
  if (model.largestExpense) {
    items.push({
      label: 'Maior gasto',
      value: formatBrl(model.largestExpense.amount),
      hint: `${model.largestExpense.description}, em ${formatShortDate(model.largestExpense.occurredOn)}`,
    })
  }
  if (top) {
    items.push({
      label: 'Categoria que mais pesou',
      value: top.name,
      hint: `${formatBrl(top.total)}, ${formatPercent(top.share)} dos gastos.`,
    })
  }

  return (
    <Section title="Destaques" description="O que vale notar neste mês.">
      {items.length === 0 ? (
        <ChartEmpty icon={Lightbulb} message="Os destaques aparecem conforme vocês lançam gastos." />
      ) : (
        <ul className="surface grid overflow-hidden">
          {items.map((item) => (
            <li key={item.label} className="grid gap-1 border-t border-border px-5 py-4 first:border-t-0">
              <p className="eyebrow">{item.label}</p>
              <p className="figure truncate text-xl font-semibold">{item.value}</p>
              {item.hint ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export function BudgetsCard({ usage, month }: { usage: BudgetUsage[]; month: string }) {
  return (
    <Section
      title="Metas por categoria"
      description="A partir de 80% do limite a meta entra em alerta."
      action={<CardLink to={`/orcamentos?mes=${month}`}>Ajustar metas</CardLink>}
    >
      {usage.length === 0 ? (
        <ChartEmpty icon={Target} message="Nenhuma meta definida para este mês." />
      ) : (
        <ul className="surface grid gap-5 p-5 sm:p-6">
          {usage.slice(0, 6).map((item) => {
            const tone = statusTone[item.status]
            const StatusIcon = tone.icon
            const remaining = item.budget.limitAmount - item.spent
            return (
              <li key={item.budget.id} className="grid gap-2">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold">{item.categoryName}</span>
                  </span>
                  <span className="figure shrink-0 text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatBrl(item.spent)}</span> de{' '}
                    {formatBrl(item.budget.limitAmount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-track">
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-700 ease-fluid', tone.bar)}
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('flex items-center gap-1 font-semibold', tone.text)}>
                    <StatusIcon className="size-3.5" aria-hidden="true" />
                    {budgetStatusLabel(item.status)}, {item.percent}%
                  </span>
                  <span className="text-muted-foreground">
                    {remaining >= 0 ? `Restam ${formatBrl(remaining)}` : `Passou ${formatBrl(-remaining)}`}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

export function RecentCard({
  transactions,
  categories,
  month,
  onAdd,
  canAdd,
}: {
  transactions: Transaction[]
  categories: Category[]
  month: string
  onAdd: () => void
  canAdd: boolean
}) {
  return (
    <Section
      title="Lançamentos recentes"
      description="Os últimos movimentos do mês."
      action={<CardLink to={`/lancamentos?mes=${month}`}>Ver todos</CardLink>}
    >
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-input py-10 text-center">
          <p className="text-sm text-muted-foreground">Nada lançado neste mês.</p>
          <Button variant="outline" size="sm" onClick={onAdd} disabled={!canAdd}>
            <Plus className="size-3.5" />
            Novo lançamento
          </Button>
        </div>
      ) : (
        <TransactionGroups transactions={transactions} categories={categories} />
      )}
    </Section>
  )
}
