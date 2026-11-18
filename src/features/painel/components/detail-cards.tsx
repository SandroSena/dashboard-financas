import { formatBrl } from '@/domain/money'
import { formatShortDate, toIsoDate } from '@/domain/month'
import { FALLBACK_COLOR, budgetStatusLabel, type BudgetUsage } from '@/domain/summary'
import type { Category, Transaction } from '@/domain/types'
import { formatPercent } from '@/features/painel/format'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { CardLink, ChartEmpty } from '@/features/painel/components/card-parts'
import { statusTone } from '@/features/painel/components/status-tone'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { CalendarDays, Flame, Lightbulb, PiggyBank, Plus, Receipt, Target, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function HighlightsCard({ model, insights }: { model: DashboardModel; insights: DashboardInsights }) {
  const top = insights.categories[0]
  const items: Array<{ icon: LucideIcon; label: string; value: ReactNode; hint?: string }> = []

  if (insights.projectedExpense !== null) {
    items.push({
      icon: Lightbulb,
      label: 'Projeção para o fim do mês',
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
      icon: CalendarDays,
      label: 'Média por dia',
      value: formatBrl(insights.dailyAverage),
      hint: `Em ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'dia' : 'dias'} do mês.`,
    })
  }
  if (model.largestExpense) {
    items.push({
      icon: Flame,
      label: 'Maior gasto',
      value: formatBrl(model.largestExpense.amount),
      hint: `${model.largestExpense.description} · ${formatShortDate(model.largestExpense.occurredOn)}`,
    })
  }
  if (top) {
    items.push({
      icon: PiggyBank,
      label: 'Categoria que mais pesou',
      value: top.name,
      hint: `${formatPercent(top.share)} dos gastos · ${formatBrl(top.total)}`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destaques</CardTitle>
        <CardDescription>O que vale a pena notar neste mês.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <ChartEmpty icon={Lightbulb} message="Os destaques aparecem conforme você lança gastos." />
        ) : (
          <ul className="grid gap-4">
            {items.map((item) => (
              <li key={item.label} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="truncate font-semibold">{item.value}</p>
                  {item.hint ? <p className="truncate text-xs text-muted-foreground">{item.hint}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function BudgetsCard({ usage, month }: { usage: BudgetUsage[]; month: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Metas por categoria</CardTitle>
          <CardDescription>A partir de 80% a meta fica em alerta.</CardDescription>
        </div>
        <CardLink to={`/orcamentos?mes=${month}`}>Ajustar</CardLink>
      </CardHeader>
      <CardContent>
        {usage.length === 0 ? (
          <ChartEmpty icon={Target} message="Nenhuma meta definida para este mês." />
        ) : (
          <ul className="grid gap-4">
            {usage.slice(0, 5).map((item) => {
              const tone = statusTone[item.status]
              const StatusIcon = tone.icon
              const remaining = item.budget.limitAmount - item.spent
              return (
                <li key={item.budget.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-medium">{item.categoryName}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      <span className="text-foreground">{formatBrl(item.spent)}</span> / {formatBrl(item.budget.limitAmount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)}
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('flex items-center gap-1', tone.text)}>
                      <StatusIcon className="size-3.5" aria-hidden="true" />
                      {budgetStatusLabel(item.status)} · {item.percent}%
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
      </CardContent>
    </Card>
  )
}

function relativeDay(iso: string): string {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso === toIsoDate(today)) return 'Hoje'
  if (iso === toIsoDate(yesterday)) return 'Ontem'
  return formatShortDate(iso)
}

export function RecentCard({
  transactions,
  categories,
  month,
  onAdd,
}: {
  transactions: Transaction[]
  categories: Category[]
  month: string
  onAdd: () => void
}) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const groups: Array<{ date: string; items: Transaction[] }> = []
  for (const transaction of transactions) {
    const last = groups.at(-1)
    if (last?.date === transaction.occurredOn) last.items.push(transaction)
    else groups.push({ date: transaction.occurredOn, items: [transaction] })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Lançamentos recentes</CardTitle>
          <CardDescription>Os últimos movimentos do mês.</CardDescription>
        </div>
        <CardLink to={`/lancamentos?mes=${month}`}>Ver todos</CardLink>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Receipt className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nada lançado neste mês.</p>
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="size-3.5" />
              Adicionar lançamento
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <div key={group.date} className="grid gap-1">
                <p className="text-xs font-medium text-muted-foreground">{relativeDay(group.date)}</p>
                <ul className="grid">
                  {group.items.map((transaction) => {
                    const category = byId.get(transaction.categoryId)
                    const color = category?.color ?? FALLBACK_COLOR
                    const isIncome = transaction.kind === 'income'
                    return (
                      <li key={transaction.id} className="flex items-center gap-3 rounded-lg py-2">
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                          style={{ backgroundColor: `${color}1f`, color }}
                          aria-hidden="true"
                        >
                          {(category?.name ?? '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{transaction.description}</p>
                          <p className="truncate text-xs text-muted-foreground">{category?.name ?? 'Sem categoria'}</p>
                        </div>
                        <span
                          className={cn('shrink-0 text-sm font-medium tabular-nums', isIncome ? 'text-income' : 'text-foreground')}
                        >
                          {isIncome ? '+' : '−'}
                          {formatBrl(transaction.amount)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
