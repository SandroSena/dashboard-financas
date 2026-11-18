import { formatBrl } from '@/domain/money'
import {
  BudgetRadar,
  EmptyChart,
  ExpenseScatter,
  SharePie,
  StackedCategoryArea
} from '@/features/painel/layouts/charts'
import { hasNumbers } from '@/features/painel/layouts/has-numbers'
import { DashboardLab } from '@/features/painel/layouts/lab-frame'
import type { DashboardModel } from '@/features/painel/model'
import { MoneyText } from '@/shared/components/money-text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function AtlasPage() {
  return (
    <DashboardLab title="Atlas" description="Mapa do mês: calendário, categorias e o quanto cada meta já foi usada.">
      {(model) => <AtlasView model={model} />}
    </DashboardLab>
  )
}

function AtlasView({ model }: { model: DashboardModel }) {
  const radar = model.usage.slice(0, 6).map((item) => ({
    name: item.categoryName.length > 14 ? `${item.categoryName.slice(0, 13)}…` : item.categoryName,
    gasto: item.spent,
    meta: item.budget.limitAmount,
  }))
  const peak = model.calendar.reduce((max, cell) => Math.max(max, cell.total), 0)

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InlineStat label="Receitas" value={<MoneyText value={model.income} tone="income" />} />
        <InlineStat label="Gastos" value={<MoneyText value={model.expense} tone="expense" />} />
        <InlineStat label="Saldo" value={<MoneyText value={model.balance} tone="balance" />} />
        <InlineStat
          label="Metas"
          value={
            model.overall.limit === 0 ? (
              <span>Sem meta</span>
            ) : (
              <span className="tabular-nums">{model.overall.percent}%</span>
            )
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Calendário de gastos</CardTitle>
            <CardDescription>
              {peak === 0 ? 'Nenhum gasto neste mês.' : `O dia mais alto chegou a ${formatBrl(peak)}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => (
                <div key={day} className="pb-1 text-center text-[11px] text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: model.calendarOffset }, (_, index) => (
                <div key={`vazio-${index}`} />
              ))}
              {model.calendar.map((cell) => (
                <div
                  key={cell.date}
                  title={cell.total === 0 ? `Dia ${cell.day}` : `Dia ${cell.day}: ${formatBrl(cell.total)}`}
                  className="grid aspect-square place-items-center rounded-md text-xs tabular-nums"
                  style={{
                    backgroundColor:
                      cell.total === 0
                        ? 'var(--muted)'
                        : `color-mix(in oklch, var(--expense) ${Math.round(22 + cell.intensity * 78)}%, var(--muted))`,
                    color: cell.intensity > 0.72 ? 'white' : 'var(--foreground)',
                  }}
                >
                  {cell.day}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Menor</span>
              <span className="h-2 flex-1 rounded-full" style={{ background: 'linear-gradient(to right, var(--muted), var(--expense))' }} />
              <span>Maior</span>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Dispersão</CardTitle>
            <CardDescription>Cada ponto é um gasto: o dia no eixo horizontal, o valor no vertical.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.scatter.length === 0 ? <EmptyChart message="Nenhum gasto neste mês." /> : <ExpenseScatter points={model.scatter} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Categorias no tempo</CardTitle>
            <CardDescription>As quatro maiores, empilhadas ao longo de seis meses.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.stackSeries.length === 0 || !hasNumbers(model.stackPoints, model.stackSeries.map((item) => item.id)) ? (
              <EmptyChart message="Nenhum gasto nos últimos seis meses." />
            ) : (
              <StackedCategoryArea points={model.stackPoints} series={model.stackSeries} />
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Gasto e meta</CardTitle>
            <CardDescription>O radar compara o que saiu com o limite de cada categoria.</CardDescription>
          </CardHeader>
          <CardContent>
            {radar.length === 0 ? <EmptyChart message="Nenhuma meta neste mês." /> : <BudgetRadar points={radar} />}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fatia dos gastos</CardTitle>
          <CardDescription>A mesma divisão do mês, agora em pizza cheia.</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
          {model.expenseSlices.length === 0 ? (
            <EmptyChart message="Nenhum gasto neste mês." />
          ) : (
            <>
              <SharePie slices={model.expenseSlices} total={model.expense} label="Gastos por categoria" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {model.expenseSlices.map((slice) => {
                  const share = model.expense > 0 ? Math.round((slice.total / model.expense) * 100) : 0
                  return (
                    <li key={slice.categoryId} className="grid gap-1.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="truncate">{slice.name}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{share}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: slice.color }} />
                      </div>
                      <MoneyText value={slice.total} className="text-xs" />
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InlineStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-baseline justify-between gap-3 py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}
