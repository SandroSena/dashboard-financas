import { formatBrl } from '@/domain/money'
import { capitalize } from '@/domain/month'
import { DataTable, LegendItem, MonthlyBars, SpendingPace } from '@/features/painel/charts'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { ChartEmpty, ViewToggle } from '@/features/painel/components/card-parts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'
import { CalendarDays, Flame } from 'lucide-react'
import { useState } from 'react'

export function PaceCard({
  model,
  insights,
  previousLabel,
  className,
}: {
  model: DashboardModel
  insights: DashboardInsights
  previousLabel: string
  className?: string
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const diff =
    insights.previousAtSameDay !== null && insights.daysElapsed > 0
      ? (insights.pace[insights.daysElapsed - 1]?.current ?? 0) - insights.previousAtSameDay
      : null

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Ritmo de gastos</CardTitle>
          <CardDescription>
            {diff === null
              ? 'Quanto já saiu, somado dia a dia ao longo do mês.'
              : diff > 0
                ? `Até aqui, ${formatBrl(diff)} a mais que no mesmo ponto de ${previousLabel}.`
                : diff < 0
                  ? `Até aqui, ${formatBrl(-diff)} a menos que no mesmo ponto de ${previousLabel}.`
                  : `Mesmo ritmo de ${previousLabel}.`}
          </CardDescription>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </CardHeader>
      <CardContent className="grid flex-1 content-start gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <LegendItem color="var(--expense)" label="Este mês" />
          {insights.projectedExpense !== null ? <LegendItem color="var(--expense)" label="Projeção" dashed /> : null}
          {insights.previous ? <LegendItem color="var(--chart-muted)" label={capitalize(previousLabel)} /> : null}
        </div>
        {model.expense === 0 && !insights.previous ? (
          <ChartEmpty icon={Flame} message="O ritmo aparece assim que o primeiro gasto for lançado." />
        ) : view === 'chart' ? (
          <SpendingPace points={insights.pace} totalDays={insights.totalDays} previousLabel={previousLabel} />
        ) : (
          <DataTable
            caption="Gasto acumulado por dia"
            columns={['Dia', 'Gasto no dia', 'Acumulado', capitalize(previousLabel)]}
            rows={insights.pace.map((point, index) => [
              point.day,
              formatBrl(model.days[index]?.total ?? 0),
              point.current === null ? '—' : formatBrl(point.current),
              point.previous === null ? '—' : formatBrl(point.previous),
            ])}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function MonthlyCard({ model, className }: { model: DashboardModel; className?: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const hasData = model.months.some((point) => point.income > 0 || point.expense > 0)
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Últimos 6 meses</CardTitle>
          <CardDescription>Receitas e gastos lado a lado. O mês aberto fica em destaque.</CardDescription>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </CardHeader>
      <CardContent className="grid flex-1 content-start gap-4">
        <div className="flex gap-5">
          <LegendItem color="var(--income)" label="Receitas" />
          <LegendItem color="var(--expense)" label="Gastos" />
        </div>
        {!hasData ? (
          <ChartEmpty icon={CalendarDays} message="Ainda não há histórico para comparar." />
        ) : view === 'chart' ? (
          <MonthlyBars months={model.months} activeKey={model.month} />
        ) : (
          <DataTable
            caption="Receitas, gastos e saldo por mês"
            columns={['Mês', 'Receitas', 'Gastos', 'Saldo']}
            rows={model.months.map((point) => [
              point.label,
              formatBrl(point.income),
              formatBrl(point.expense),
              <span key="saldo" className={point.balance >= 0 ? 'text-income' : 'text-expense'}>
                {formatBrl(point.balance)}
              </span>,
            ])}
          />
        )}
      </CardContent>
    </Card>
  )
}
