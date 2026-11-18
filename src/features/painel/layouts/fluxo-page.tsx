import { formatShortDate } from '@/domain/month'
import { CumulativeArea, EmptyChart, SavingsRing, SharePie, SpendTreemap } from '@/features/painel/layouts/charts'
import { hasNumbers } from '@/features/painel/layouts/has-numbers'
import { DashboardLab } from '@/features/painel/layouts/lab-frame'
import type { DashboardModel } from '@/features/painel/model'
import { MoneyText } from '@/shared/components/money-text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function FluxoPage() {
  return (
    <DashboardLab title="Fluxo" description="Como o dinheiro entra, sai e se acumula ao longo do mês.">
      {(model) => <FluxoView model={model} />}
    </DashboardLab>
  )
}

function FluxoView({ model }: { model: DashboardModel }) {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Saldo do mês</CardTitle>
            <CardDescription>O que sobrou depois das saídas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-3xl font-semibold tracking-tight">
              <MoneyText value={model.balance} tone="balance" />
            </p>
            {model.savingsPercent === null ? (
              <p className="text-sm text-muted-foreground">Sem receita neste mês para calcular a poupança.</p>
            ) : (
              <SavingsRing percent={model.savingsPercent} />
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Entrou</dt>
                <dd className="mt-1 font-medium">
                  <MoneyText value={model.income} tone="income" />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Saiu</dt>
                <dd className="mt-1 font-medium">
                  <MoneyText value={model.expense} tone="expense" />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Acumulado</CardTitle>
            <CardDescription>A área mostra o total corrido até cada dia.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasNumbers(model.flow, ['income', 'expense']) ? (
              <CumulativeArea flow={model.flow} />
            ) : (
              <EmptyChart message="Nenhuma movimentação neste mês." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Para onde saiu</CardTitle>
            <CardDescription>Rosca dos gastos por categoria.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.expenseSlices.length === 0 ? (
              <EmptyChart message="Nenhum gasto neste mês." />
            ) : (
              <>
                <SharePie slices={model.expenseSlices} total={model.expense} label="Gastos" donut />
                <SliceList slices={model.expenseSlices} />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>De onde veio</CardTitle>
            <CardDescription>Rosca das receitas por categoria.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.incomeSlices.length === 0 ? (
              <EmptyChart message="Nenhuma receita neste mês." />
            ) : (
              <>
                <SharePie slices={model.incomeSlices} total={model.income} label="Receitas" donut />
                <SliceList slices={model.incomeSlices} />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Peso das categorias</CardTitle>
            <CardDescription>Cada bloco é proporcional ao gasto.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.expenseSlices.length === 0 ? <EmptyChart message="Nenhum gasto neste mês." /> : <SpendTreemap slices={model.expenseSlices} />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimentos</CardTitle>
            <CardDescription>Os lançamentos mais recentes do mês.</CardDescription>
          </CardHeader>
          <CardContent>
            {model.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada lançado neste mês.</p>
            ) : (
              <ul className="grid gap-3">
                {model.recent.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.categoryName.get(transaction.categoryId) ?? 'Categoria'} · {formatShortDate(transaction.occurredOn)}
                      </p>
                    </div>
                    <MoneyText
                      value={transaction.amount}
                      tone={transaction.kind === 'income' ? 'income' : 'expense'}
                      className="font-medium"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function SliceList({ slices }: { slices: DashboardModel['expenseSlices'] }) {
  return (
    <ul className="mt-2 grid gap-2">
      {slices.map((slice) => (
        <li key={slice.categoryId} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="truncate">{slice.name}</span>
          </span>
          <MoneyText value={slice.total} />
        </li>
      ))}
    </ul>
  )
}
