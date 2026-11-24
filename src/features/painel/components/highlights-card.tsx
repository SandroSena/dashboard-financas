import { formatBrl } from '@/domain/money'
import { useDashboardActions } from '@/features/painel/actions-context'
import { PanelSection } from '@/features/painel/components/panel-card'
import { formatDayShort, formatPercent, plural } from '@/features/painel/format'
import type { ComparisonCopy, DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { EmptyState } from '@/shared/components/feedback'
import { ChevronRight, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

type Item = { key: string; label: string; value: ReactNode; hint: string; onSelect?: () => void }

/**
  Destaques (spec 4.10). Itens clicáveis são botões com chevron: projeção (rola até o ritmo
  e liga a série), maior gasto (folha do dia com a linha marcada), categorias (folha).
*/
export function HighlightsCard({
  model,
  insights,
  copy,
  onShowProjection,
}: {
  model: DashboardModel
  insights: DashboardInsights
  copy: ComparisonCopy
  onShowProjection: () => void
}) {
  const actions = useDashboardActions()
  const top = insights.expenseBreakdown.rows[0]
  const items: Item[] = []

  if (insights.projectedExpense !== null) {
    items.push({
      key: 'projecao',
      label: 'Projeção de gastos no fim do mês',
      value: formatBrl(insights.projectedExpense),
      hint:
        model.income > 0
          ? insights.projectedExpense > model.income
            ? 'Nesse ritmo, os gastos passam das receitas.'
            : `Nesse ritmo, sobram ${formatBrl(model.income - insights.projectedExpense)}.`
          : 'Se o ritmo atual continuar.',
      onSelect: onShowProjection,
    })
  }
  if (insights.daysElapsed > 0 && model.expense > 0) {
    items.push({
      key: 'media',
      label: 'Média por dia',
      value: formatBrl(insights.dailyAverage),
      hint: `Em ${plural(insights.daysElapsed, 'dia', 'dias')} do mês.`,
    })
  }
  const largest = model.largestExpense
  if (largest) {
    items.push({
      key: 'maior',
      label: 'Maior gasto',
      value: formatBrl(largest.amount),
      hint: `${largest.description}, em ${formatDayShort(largest.occurredOn)}.`,
      onSelect: () => actions.openDay(largest.occurredOn, largest.id),
    })
  }
  if (top) {
    items.push({
      key: 'pesou',
      label: 'Categoria que mais pesou',
      value: top.name,
      hint: `${formatBrl(top.total)}, ${formatPercent(top.share)} dos gastos.`,
      onSelect: () => actions.openCategory(top.categoryId),
    })
  }
  const growth = insights.topGrowth
  if (growth && growth.diff !== null) {
    items.push({
      key: 'cresceu',
      label: 'Categoria que mais cresceu',
      value: growth.name,
      hint: `${growth.name}, ${formatBrl(growth.diff)} ${copy.more}.`,
      onSelect: () => actions.openCategory(growth.categoryId),
    })
  }

  return (
    <PanelSection title="Destaques" description="O que vale notar neste mês.">
      {items.length === 0 ? (
        <EmptyState
          variant="compact"
          className="rounded-card border border-dashed border-input"
          icon={<Lightbulb />}
          title="Os destaques aparecem conforme vocês lançam gastos."
        />
      ) : (
        <ul className="surface grid overflow-hidden rounded-card">
          {items.map((item) => {
            const content = (
              <>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="eyebrow">{item.label}</span>
                  <span className="figure truncate text-title-sm font-semibold">{item.value}</span>
                  <span className="text-caption text-muted-foreground">{item.hint}</span>
                </span>
                {item.onSelect ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
              </>
            )
            return (
              <li key={item.key} className="border-t border-border first:border-t-0">
                {item.onSelect ? (
                  <button
                    type="button"
                    onClick={item.onSelect}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition-colors duration-(--duration-fast) hover:bg-accent/50"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-4">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </PanelSection>
  )
}
