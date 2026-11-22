import { formatBrl } from '@/domain/money'
import { monthName } from '@/domain/month'
import { formatPercent } from '@/features/painel/format'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { Amount } from '@/shared/components/amount'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CalendarDays, Plus, Sparkles } from 'lucide-react'

export function EmptyMonth({ month, onAdd, disabled }: { month: string; onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground" aria-hidden="true">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">Nada lançado em {monthName(month)} ainda</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Comecem pela receita do mês e pelos primeiros gastos. O saldo, o ritmo e as metas aparecem logo abaixo.
          </p>
        </div>
      </div>
      <Button onClick={onAdd} disabled={disabled} className="shrink-0">
        <Plus className="size-4" />
        Novo lançamento
      </Button>
    </div>
  )
}

/**
  Abertura do painel: o número que importa (quanto sobra) em destaque, uma frase de contexto
  e a régua do mês. A régua é a receita inteira; a parte cheia é o que já saiu; a marca fina é hoje.
  Os indicadores detalhados ficam na faixa logo abaixo (kpi-cards.tsx).
*/
export function MonthHero({
  model,
  insights,
  month,
}: {
  model: DashboardModel
  insights: DashboardInsights
  month: string
}) {
  const name = monthName(month)
  const hasIncome = model.income > 0
  const spentShare = hasIncome ? model.expense / model.income : null
  const timeShare = insights.isCurrentMonth && insights.totalDays > 0 ? insights.daysElapsed / insights.totalDays : null
  const over = model.balance < 0
  const ahead = spentShare !== null && timeShare !== null && spentShare > timeShare + 0.03

  const headline = !hasIncome
    ? model.expense > 0
      ? { verb: insights.isCurrentMonth ? 'Já saíram' : 'Saíram', value: model.expense }
      : { verb: `Em ${name}`, value: 0 }
    : over
      ? { verb: 'Faltam', value: -model.balance }
      : { verb: insights.isCurrentMonth ? 'Sobram' : 'Sobraram', value: model.balance }

  const lead = hasIncome
    ? `Em ${name} entraram ${formatBrl(model.income)} e ${insights.isCurrentMonth ? 'já saíram' : 'saíram'} ${formatBrl(
        model.expense,
      )}.`
    : model.expense > 0
      ? `Ainda não há receita lançada em ${name}.`
      : `Nenhum movimento em ${name}.`

  const verdict = !hasIncome
    ? 'Lancem a receita do mês para ver quanto ainda sobra.'
    : over
      ? 'Os gastos já passaram do que entrou neste mês.'
      : timeShare === null
        ? model.savingsPercent !== null
          ? `Vocês guardaram ${model.savingsPercent}% do que entrou.`
          : null
        : ahead
          ? 'O gasto está na frente do calendário. Vale segurar um pouco até o fim do mês.'
          : 'O gasto está atrás do calendário. Dá para respirar.'

  const verdictTone = over ? 'text-expense' : ahead ? 'text-warning' : hasIncome ? 'text-income' : 'text-muted-foreground'
  const fill = spentShare === null ? 0 : Math.min(spentShare, 1)
  const fillTone = over ? 'bg-expense' : ahead ? 'bg-warning' : 'bg-brand'

  return (
    <section className="grid gap-7" aria-labelledby="month-hero-title">
      <div className="grid gap-3">
        <p className="eyebrow">{hasIncome ? (over ? 'Saldo negativo do mês' : 'Saldo livre do mês') : 'Resumo do mês'}</p>
        <h1
          id="month-hero-title"
          className="flex flex-wrap items-baseline gap-x-[0.28em] text-[2.75rem] leading-[0.95] font-semibold sm:text-7xl lg:text-[5.25rem]"
        >
          <span className="font-sans text-[0.42em] font-medium tracking-tight text-muted-foreground">{headline.verb}</span>
          <Amount
            value={headline.value}
            className={cn('font-sans tracking-[-0.035em] [font-variant-numeric:lining-nums_proportional-nums]', over && 'text-expense')}
            minorClassName="opacity-50"
          />
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{lead}</p>
      </div>

      {hasIncome ? (
        <div className="grid gap-3">
          <div
            className="relative h-3.5 rounded-full bg-track"
            role="img"
            aria-label={`Já saiu ${formatPercent(spentShare ?? 0)} da receita${
              timeShare !== null ? `; o mês está em ${formatPercent(timeShare)}` : ''
            }.`}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className={cn('fill-in h-full rounded-full', fillTone)} style={{ width: `${fill * 100}%` }} />
            </div>
            {timeShare !== null ? (
              <div
                className="absolute -inset-y-1.5 w-[3px] -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background"
                style={{ left: `${timeShare * 100}%` }}
                aria-hidden="true"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span className={cn('size-2 rounded-full', fillTone)} aria-hidden="true" />
              Já saiu {formatPercent(spentShare ?? 0)} da receita
            </span>
            {timeShare !== null ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Dia {insights.daysElapsed} de {insights.totalDays}
              </span>
            ) : null}
          </div>
          {verdict ? <p className={cn('text-[15px] font-medium', verdictTone)}>{verdict}</p> : null}
        </div>
      ) : verdict ? (
        <p className="text-[15px] text-muted-foreground">{verdict}</p>
      ) : null}
    </section>
  )
}
