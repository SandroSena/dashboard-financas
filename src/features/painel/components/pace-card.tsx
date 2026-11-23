import { formatBrl } from '@/domain/money'
import { useDashboardActions } from '@/features/painel/actions-context'
import { useAnnounce } from '@/features/painel/announce-context'
import { SeriesSwatch, type SeriesStyle } from '@/features/painel/charts/chart-tooltip'
import { DataTable } from '@/features/painel/charts/data-table'
import { SpendingPace, type PaceSeries, type PaceVisibility } from '@/features/painel/charts/spending-pace'
import { PanelCard } from '@/features/painel/components/panel-card'
import { VIEW_OPTIONS, type ChartView } from '@/features/painel/components/view-options'
import { isoOfDay } from '@/features/painel/format'
import { paceDiff, type ComparisonCopy, type DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { EmptyState } from '@/shared/components/feedback'
import { cn } from '@/shared/lib/utils'
import { Segmented } from '@/shared/ui/segmented'
import { Tooltip } from '@/shared/ui/tooltip'
import { Flame } from 'lucide-react'
import { useState } from 'react'

export const PACE_CARD_ID = 'painel-ritmo'

function describePace(insights: DashboardInsights, copy: ComparisonCopy): string {
  const point = insights.pace[insights.daysElapsed - 1]
  const diff = insights.comparison ? paceDiff(point) : null
  if (diff === null) return 'Quanto já saiu, somado dia a dia ao longo do mês.'
  if (diff === 0) return insights.compare === 'media' ? 'Mesmo ritmo da média de 3 meses.' : `Mesmo ritmo de ${copy.phrase}.`
  if (insights.compare === 'media') return `Até aqui, ${formatBrl(Math.abs(diff))} ${diff > 0 ? copy.more : copy.less}.`
  return `Até aqui, ${formatBrl(Math.abs(diff))} ${diff > 0 ? 'a mais' : 'a menos'} que ${copy.samePoint}.`
}

/**
  Ritmo de gastos (spec 4.4). A legenda é um grupo de filtros: cada série liga/desliga
  (`aria-pressed`) e pelo menos uma fica sempre ligada (UX-20).
*/
export function PaceCard({
  model,
  insights,
  copy,
  activeDay,
  onActiveDayChange,
  visible,
  onVisibleChange,
  className,
}: {
  model: DashboardModel
  insights: DashboardInsights
  copy: ComparisonCopy
  activeDay: number | null
  onActiveDayChange: (day: number | null) => void
  visible: PaceVisibility
  onVisibleChange: (next: PaceVisibility) => void
  className?: string
}) {
  const [view, setView] = useState<ChartView>('chart')
  const actions = useDashboardActions()
  const announce = useAnnounce()
  const description = describePace(insights, copy)
  const hasData = model.expense > 0 || insights.comparison !== null

  const available: Array<{ key: PaceSeries; label: string; color: string; style: SeriesStyle }> = [
    { key: 'current', label: 'Este mês', color: 'var(--expense)', style: 'solid' },
  ]
  if (insights.projectedExpense !== null)
    available.push({ key: 'projected', label: 'Projeção', color: 'var(--expense)', style: 'dashed' })
  if (insights.comparison) available.push({ key: 'comparison', label: copy.name, color: 'var(--chart-muted)', style: 'solid' })

  const effective: PaceVisibility = {
    current: visible.current,
    projected: visible.projected && insights.projectedExpense !== null,
    comparison: visible.comparison && insights.comparison !== null,
  }
  const onCount = available.filter((series) => effective[series.key]).length

  return (
    <PanelCard
      id={PACE_CARD_ID}
      title="Ritmo de gastos"
      description={description}
      className={className}
      actions={<Segmented label="Modo de visualização do ritmo" iconOnly size="sm" value={view} onChange={setView} options={VIEW_OPTIONS} />}
    >
      {!hasData ? (
        <EmptyState variant="compact" icon={<Flame />} title="O ritmo aparece assim que o primeiro gasto for lançado." />
      ) : view === 'chart' ? (
        <>
          <div role="group" aria-label="Linhas do gráfico" className="flex flex-wrap gap-2">
            {available.map((series) => {
              const pressed = effective[series.key]
              const locked = pressed && onCount <= 1
              const button = (
                <button
                  key={series.key}
                  type="button"
                  aria-pressed={pressed}
                  aria-disabled={locked || undefined}
                  onClick={() => {
                    if (locked) return
                    onVisibleChange({ ...visible, [series.key]: !pressed })
                  }}
                  className={cn(
                    'inline-flex h-8 cursor-pointer items-center gap-2 rounded-full px-3 text-body-sm font-medium inset-ring inset-ring-border transition-[background-color,color] duration-(--duration-base) ease-standard pointer-coarse:h-11',
                    pressed ? 'bg-card text-foreground' : 'text-muted-foreground line-through decoration-1 hover:text-foreground',
                    locked && 'cursor-not-allowed',
                  )}
                >
                  <SeriesSwatch color={series.color} style={series.style} />
                  {series.label}
                </button>
              )
              return locked ? (
                <Tooltip key={series.key} content="Deixe pelo menos uma linha visível">
                  {button}
                </Tooltip>
              ) : (
                button
              )
            })}
          </div>
          <SpendingPace
            points={insights.pace}
            month={model.month}
            maxDay={insights.daysElapsed}
            activeDay={activeDay}
            onActiveDayChange={onActiveDayChange}
            onOpenDay={(day) => actions.openDay(isoOfDay(model.month, day))}
            visible={effective}
            copy={copy}
            hasComparison={insights.comparison !== null}
            summary={`Ritmo de gastos. ${description} Use as setas para percorrer os dias e Enter para ver um dia.`}
            onAnnounce={announce}
          />
        </>
      ) : (
        <DataTable
          caption="Gasto acumulado por dia"
          columns={['Dia', 'Gasto no dia', 'Acumulado', ...(insights.comparison ? [copy.name] : []), ...(insights.projectedExpense !== null ? ['Projeção'] : [])]}
          rowKeys={insights.pace.map((point) => String(point.day))}
          rows={insights.pace.map((point) => [
            point.day,
            formatBrl(point.dayExpense),
            point.current === null ? '—' : formatBrl(point.current),
            ...(insights.comparison ? [point.comparison === null ? '—' : formatBrl(point.comparison)] : []),
            ...(insights.projectedExpense !== null ? [point.projected === null || point.current !== null ? '—' : formatBrl(point.projected)] : []),
          ])}
        />
      )}
    </PanelCard>
  )
}
