import { formatBrl, toCents } from '@/domain/money'
import { monthLabel, monthName } from '@/domain/month'
import { BudgetMeter } from '@/features/orcamentos/budget-meter'
import { useDashboardActions } from '@/features/painel/actions-context'
import { TransactionList } from '@/features/painel/components/transaction-list'
import type { CategoryDetail, CategoryMonthBar } from '@/features/painel/detail'
import { formatPercent } from '@/features/painel/format'
import type { ComparisonCopy } from '@/features/painel/insights'
import { budgetsLink, transactionsLink } from '@/features/painel/links'
import { Amount } from '@/shared/components/amount'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { Delta } from '@/shared/components/delta'
import { categoryColorVar } from '@/shared/lib/category-colors'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Sheet } from '@/shared/ui/sheet'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'

/**
  Folha de detalhe da categoria (`?categoria=`, spec 4.11): total, variação, participação,
  meta, barras dos meses da janela (cada uma troca o mês e mantém a folha) e os lançamentos.
*/
export function CategorySheet({
  detail,
  open,
  onClose,
  month,
  copy,
  hasComparison,
  onSelectMonth,
}: {
  detail: CategoryDetail | null
  open: boolean
  onClose: () => void
  month: string
  copy: ComparisonCopy
  hasComparison: boolean
  onSelectMonth: (key: string) => void
}) {
  const actions = useDashboardActions()
  if (!detail) return null
  const { category } = detail
  const isExpense = detail.kind === 'expense'
  const name = monthName(month)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={
        <span className="flex items-center gap-3">
          <CategoryAvatar name={category.name} color={category.color} />
          <span className="min-w-0 truncate">{category.name}</span>
        </span>
      }
      description={`${isExpense ? 'Gastos' : 'Receitas'} de ${name}`}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={!actions.canAdd}
            onClick={() => actions.newTransaction({ kind: detail.kind, categoryId: category.id })}
          >
            <Plus aria-hidden="true" />
            {isExpense ? `Novo gasto em ${category.name}` : `Nova receita em ${category.name}`}
          </Button>
          <Button asChild>
            <Link to={transactionsLink(month, { kind: detail.kind, categoryId: category.id })}>Ver em Lançamentos</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-1.5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Amount value={detail.total} className="figure text-heading font-semibold" />
            {hasComparison ? (
              <Delta
                value={detail.change}
                unit="percent"
                goodWhen={isExpense ? 'down' : 'up'}
                comparison={copy.phrase}
                label={copy.deltaLabel}
                emptyLabel={detail.isNew ? 'Nova neste mês' : copy.emptyLabel}
              />
            ) : (
              <span className="text-caption text-muted-foreground">{copy.emptyLabel}</span>
            )}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {formatPercent(detail.share)} dos {isExpense ? 'gastos' : 'receitas'} do mês
          </p>
        </div>

        {isExpense ? (
          detail.budget ? (
            <section aria-label="Meta" className="grid gap-2 rounded-control bg-sunken p-4">
              <p className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="font-semibold">Meta</span>
                <span className="figure text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatBrl(detail.budget.spent)}</span> de{' '}
                  {formatBrl(detail.budget.budget.limitAmount)}
                </span>
              </p>
              <BudgetMeter percent={detail.budget.percent} status={detail.budget.status} label={`Meta de ${category.name}`} />
              <RemainingLine limit={detail.budget.budget.limitAmount} spent={detail.budget.spent} perDay={detail.dailyAllowance} />
            </section>
          ) : (
            <p className="flex flex-wrap items-center gap-x-2 rounded-control bg-sunken p-4 text-body-sm text-muted-foreground">
              Sem meta para {category.name} em {name}.
              <Button variant="link" size="sm" asChild>
                <Link to={budgetsLink(month, category.id)}>Definir meta</Link>
              </Button>
            </p>
          )
        ) : null}

        <section aria-labelledby="folha-categoria-meses" className="grid gap-3">
          <h3 id="folha-categoria-meses" className="text-body-sm font-semibold">
            Últimos {detail.months.length} meses
          </h3>
          <CategoryMonthBars bars={detail.months} average={detail.average} color={category.color} onSelect={onSelectMonth} />
        </section>

        <section aria-labelledby="folha-categoria-lancamentos" className="grid gap-3">
          <h3 id="folha-categoria-lancamentos" className="text-body-sm font-semibold">
            Lançamentos ({detail.transactions.length})
          </h3>
          {detail.transactions.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Nada em {category.name} em {name}.
            </p>
          ) : (
            <TransactionList transactions={detail.transactions} categoryById={new Map([[category.id, category]])} />
          )}
        </section>
      </div>
    </Sheet>
  )
}

function RemainingLine({ limit, spent, perDay }: { limit: number; spent: number; perDay: number | null }) {
  const remaining = (toCents(limit) - toCents(spent)) / 100
  return (
    <p className="flex flex-wrap justify-between gap-x-3 text-caption text-muted-foreground">
      <span className="figure">{remaining >= 0 ? `Restam ${formatBrl(remaining)}` : `Passou ${formatBrl(-remaining)}`}</span>
      {perDay !== null ? <span>Cabem {formatBrl(perDay)}/dia até o fim do mês</span> : null}
    </p>
  )
}

/**
  Mini-gráfico em HTML (barras são botões, sem Recharts): o mês aberto em destaque e a
  linha tracejada da média. Clicar numa barra troca o mês mantendo a folha (UX-27).
*/
function CategoryMonthBars({
  bars,
  average,
  color,
  onSelect,
}: {
  bars: CategoryMonthBar[]
  average: number
  color: string
  onSelect: (key: string) => void
}) {
  const max = bars.reduce((peak, bar) => Math.max(peak, bar.total), 0)
  const averagePosition = max > 0 ? average / max : 0
  return (
    <div className="grid gap-1">
      <div className="relative">
        {max > 0 && average > 0 ? (
          <span
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-chart-muted"
            style={{ bottom: `calc(1.5rem + (100% - 1.5rem) * ${averagePosition})` }}
            aria-hidden="true"
          />
        ) : null}
        <ul className="grid h-28 gap-1" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
          {bars.map((bar) => (
            <li key={bar.key} className="min-w-0">
              <button
                type="button"
                aria-current={bar.isOpen ? 'date' : undefined}
                aria-label={`${monthLabel(bar.key)}: ${formatBrl(bar.total)}.${bar.isOpen ? '' : ' Abrir este mês.'}`}
                onClick={() => {
                  if (!bar.isOpen) onSelect(bar.key)
                }}
                className="group flex size-full min-h-11 cursor-pointer flex-col items-stretch justify-end gap-1 rounded-control px-0.5 pt-1 hover:bg-accent/50"
              >
                <span className="relative flex-1" aria-hidden="true">
                  <span
                    className={cn(
                      'absolute inset-x-0.5 bottom-0 top-0 origin-bottom rounded-t-chip transition-transform duration-(--duration-base) ease-standard',
                      !bar.isOpen && 'opacity-40 group-hover:opacity-70',
                    )}
                    style={{
                      backgroundColor: categoryColorVar(color),
                      transform: `scaleY(${max > 0 ? Math.max(bar.total / max, bar.total > 0 ? 0.04 : 0) : 0})`,
                    }}
                  />
                </span>
                <span
                  className={cn('h-5 text-center text-caption', bar.isOpen ? 'font-semibold text-foreground' : 'text-muted-foreground')}
                  aria-hidden="true"
                >
                  {bar.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        <span className="w-4 border-t-2 border-dashed border-chart-muted" aria-hidden="true" />
        Média de {formatBrl(average)} por mês
      </p>
    </div>
  )
}
