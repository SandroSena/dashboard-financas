import { formatShortDate } from '@/domain/month'
import {
  BudgetRadial,
  DailyNetLine,
  EmptyChart,
  MonthComposed,
  RankBars,
  Sparkline,
  WeekdayBars
} from '@/features/painel/layouts/charts'
import { hasNumbers } from '@/features/painel/layouts/has-numbers'
import { DashboardLab } from '@/features/painel/layouts/lab-frame'
import type { DashboardModel } from '@/features/painel/model'
import { MoneyText } from '@/shared/components/money-text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PiggyBank, Receipt, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'

export function ComandoPage() {
  return (
    <DashboardLab
      title="Comando"
      description="Seis meses, metas e o ritmo da semana numa grade densa."
    >
      {(model) => <ComandoView model={model} />}
    </DashboardLab>
  )
}

function ComandoView({ model }: { model: DashboardModel }) {
  const radial = model.usage.slice(0, 6).map((item) => ({
    name: item.categoryName,
    value: Math.min(item.percent, 100),
    percent: item.percent,
    fill: item.color,
  }))

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Receitas"
          value={<MoneyText value={model.income} tone="income" />}
          hint={model.incomeCount === 1 ? '1 entrada no mês' : `${model.incomeCount} entradas no mês`}
          icon={<TrendingUp className="size-4" />}
          iconClass="bg-income/10 text-income"
          extra={<Sparkline data={model.months} dataKey="income" color="var(--income)" />}
        />
        <Stat
          label="Gastos"
          value={<MoneyText value={model.expense} tone="expense" />}
          hint={model.expenseCount === 1 ? '1 saída no mês' : `${model.expenseCount} saídas no mês`}
          icon={<TrendingDown className="size-4" />}
          iconClass="bg-expense/10 text-expense"
          extra={<Sparkline data={model.months} dataKey="expense" color="var(--expense)" />}
        />
        <Stat
          label="Saldo"
          value={<MoneyText value={model.balance} tone="balance" />}
          hint="Receitas menos gastos"
          icon={<Scale className="size-4" />}
          iconClass="bg-muted text-foreground"
          extra={<Sparkline data={model.months} dataKey="balance" color="var(--foreground)" />}
        />
        <Stat
          label="Poupança"
          value={model.savingsPercent === null ? <span>Sem receita</span> : <span className="tabular-nums">{model.savingsPercent}%</span>}
          hint="Do que entrou, quanto sobrou"
          icon={<PiggyBank className="size-4" />}
          iconClass="bg-muted text-foreground"
        />
        <Stat
          label="Ticket médio"
          value={<MoneyText value={model.averageExpense} />}
          hint="Valor médio de cada gasto"
          icon={<Receipt className="size-4" />}
          iconClass="bg-muted text-foreground"
        />
        <Stat
          label="Maior gasto"
          value={model.largestExpense ? <MoneyText value={model.largestExpense.amount} tone="expense" /> : <span>—</span>}
          hint={
            model.largestExpense
              ? `${model.largestExpense.description} · ${formatShortDate(model.largestExpense.occurredOn)}`
              : 'Nenhum gasto neste mês'
          }
          icon={<Wallet className="size-4" />}
          iconClass="bg-expense/10 text-expense"
        />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Seis meses</CardTitle>
          <CardDescription>Barras de receita e gasto, com o saldo em linha.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasNumbers(model.months, ['income', 'expense', 'balance']) ? (
            <MonthComposed months={model.months} />
          ) : (
            <EmptyChart message="Nenhuma movimentação nos últimos seis meses." />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>As seis maiores saídas do mês.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.expenseSlices.length === 0 ? <EmptyChart message="Nenhum gasto neste mês." /> : <RankBars slices={model.expenseSlices} />}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Metas</CardTitle>
            <CardDescription>
              {radial.length === 0
                ? 'Nenhuma meta neste mês.'
                : model.usage.length > radial.length
                  ? 'As seis metas mais apertadas, até 100%.'
                  : 'Quanto de cada meta já foi usado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {radial.length === 0 ? <EmptyChart message="Defina metas para ver este gráfico." /> : <BudgetRadial items={radial} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Semana</CardTitle>
            <CardDescription>Em quais dias da semana o dinheiro se move.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasNumbers(model.weekdays, ['income', 'expense']) ? (
              <WeekdayBars days={model.weekdays} />
            ) : (
              <EmptyChart message="Nenhuma movimentação neste mês." />
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Saldo diário</CardTitle>
            <CardDescription>Receita menos gasto em cada dia.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasNumbers(model.daily, ['net']) ? <DailyNetLine days={model.daily} /> : <EmptyChart message="Nenhuma movimentação neste mês." />}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  icon,
  iconClass,
  extra,
}: {
  label: string
  value: ReactNode
  hint: string
  icon: ReactNode
  iconClass: string
  extra?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className={`flex size-10 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
          {extra}
        </div>
      </CardContent>
    </Card>
  )
}
