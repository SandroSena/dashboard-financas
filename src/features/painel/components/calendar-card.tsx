import { formatBrl } from '@/domain/money'
import { monthName } from '@/domain/month'
import { useDashboardActions } from '@/features/painel/actions-context'
import { buildCalendar, calendarKeyTarget, type CalendarCell, type HeatLevel } from '@/features/painel/calendar'
import { DataTable } from '@/features/painel/charts/data-table'
import { PanelCard } from '@/features/painel/components/panel-card'
import { VIEW_OPTIONS, type ChartView } from '@/features/painel/components/view-options'
import { WEEKDAY_HEADERS, formatDayLong, formatDayShort, formatWeekdayShort, plural } from '@/features/painel/format'
import type { DashboardInsights } from '@/features/painel/insights'
import type { DashboardModel } from '@/features/painel/model'
import { EmptyState } from '@/shared/components/feedback'
import { cn } from '@/shared/lib/utils'
import { useTheme } from '@/shared/theme/theme-context'
import { Segmented } from '@/shared/ui/segmented'
import { Tooltip } from '@/shared/ui/tooltip'
import { CalendarDays } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

/* Texto sobre a célula: `foreground` nos degraus 1–3; nos 4–5, `card` no claro e `background` no escuro. */
const levelClass: Record<HeatLevel, string> = {
  0: 'bg-track text-foreground',
  1: 'bg-seq-1 text-foreground',
  2: 'bg-seq-2 text-foreground',
  3: 'bg-seq-3 text-foreground',
  4: 'bg-seq-4 text-card dark:text-background',
  5: 'bg-seq-5 text-card dark:text-background',
}

function cellSummary(cell: CalendarCell): string {
  return cell.expenseCount > 0
    ? `${formatBrl(cell.expense)} em ${plural(cell.expenseCount, 'gasto', 'gastos')}`
    : 'Nenhum gasto'
}

/**
  Dias do mês (spec 4.7): mapa de calor do gasto por dia, ideia do antigo layout Atlas.
  `role="grid"` com foco itinerante: setas andam dia/semana, Home/End vão ao começo/fim
  da semana e Enter abre a folha do dia. Dias futuros não recebem foco nem clique.
*/
export function CalendarCard({
  model,
  insights,
  className,
}: {
  model: DashboardModel
  insights: DashboardInsights
  className?: string
}) {
  const [view, setView] = useState<ChartView>('chart')
  const { theme } = useTheme()
  const actions = useDashboardActions()
  const calendar = useMemo(() => buildCalendar(model, insights), [model, insights])
  const defaultIndex = Math.max(calendar.lastEnabled, 0)
  const [focusIndex, setFocusIndex] = useState(defaultIndex)
  const [openTip, setOpenTip] = useState<number | null>(null)
  const cellRefs = useRef<Array<HTMLDivElement | null>>([])
  const index = Math.min(focusIndex, defaultIndex)

  const weeks: Array<Array<CalendarCell | null>> = []
  const padded: Array<CalendarCell | null> = [...Array.from({ length: calendar.offset }, () => null), ...calendar.cells]
  while (padded.length % 7 !== 0) padded.push(null)
  for (let start = 0; start < padded.length; start += 7) weeks.push(padded.slice(start, start + 7))

  function move(target: number) {
    setFocusIndex(target)
    setOpenTip(target)
    cellRefs.current[target]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, cell: CalendarCell, cellIndex: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      actions.openDay(cell.date)
      return
    }
    if (event.key === 'Escape') {
      setOpenTip(null)
      return
    }
    const target = calendarKeyTarget(cellIndex, event.key, calendar)
    if (target === null) return
    event.preventDefault()
    move(target)
  }

  const peak = calendar.peak
  const pastCells = calendar.cells.filter((cell) => !cell.isFuture)

  return (
    <PanelCard
      title="Dias do mês"
      description={`Quanto saiu em cada dia. ${theme === 'dark' ? 'Mais forte, mais gasto.' : 'Mais escuro, mais gasto.'}`}
      className={className}
      actions={<Segmented label="Modo de visualização dos dias" iconOnly size="sm" value={view} onChange={setView} options={VIEW_OPTIONS} />}
    >
      {!calendar.hasExpense && !insights.isFuture ? (
        <EmptyState variant="compact" icon={<CalendarDays />} title="Os dias ganham cor conforme vocês lançam gastos." />
      ) : view === 'chart' ? (
        <div className="grid gap-3">
          <div role="grid" aria-label={`Gasto por dia em ${monthName(model.month)}`} className="grid gap-1.5">
            <div role="row" className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_HEADERS.map((day) => (
                <span key={day} role="columnheader" className="text-center text-caption text-muted-foreground">
                  {day}
                </span>
              ))}
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} role="row" className="grid grid-cols-7 gap-1.5">
                {week.map((cell, column) => {
                  if (!cell) return <span key={`vazio-${column}`} role="gridcell" aria-hidden="true" />
                  const cellIndex = cell.day - 1
                  const label = `${formatDayLong(cell.date)}: ${cellSummary(cell)}`
                  if (cell.isFuture) {
                    return (
                      <div
                        key={cell.date}
                        role="gridcell"
                        aria-disabled="true"
                        aria-label={`${formatDayLong(cell.date)}: ainda não chegou`}
                        className="figure mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-chip bg-sunken text-caption font-medium text-subtle-foreground"
                      >
                        {cell.day}
                      </div>
                    )
                  }
                  return (
                    <Tooltip
                      key={cell.date}
                      open={openTip === cellIndex}
                      onOpenChange={(open) => setOpenTip(open ? cellIndex : null)}
                      content={
                        <span className="grid gap-0.5">
                          <span className="font-semibold text-muted-foreground">{formatWeekdayShort(cell.date)}</span>
                          <span className="figure text-body-sm font-semibold">{cellSummary(cell)}</span>
                          {cell.topExpense ? (
                            <span>
                              Maior: {cell.topExpense.description}, {formatBrl(cell.topExpense.amount)}
                            </span>
                          ) : null}
                        </span>
                      }
                    >
                      <div
                        ref={(element) => {
                          cellRefs.current[cellIndex] = element
                        }}
                        role="gridcell"
                        tabIndex={cellIndex === index ? 0 : -1}
                        aria-label={label}
                        aria-current={cell.isToday ? 'date' : undefined}
                        onClick={() => actions.openDay(cell.date)}
                        onFocus={() => setFocusIndex(cellIndex)}
                        onKeyDown={(event) => onKeyDown(event, cell, cellIndex)}
                        className={cn(
                          'figure mx-auto grid aspect-square w-full max-w-11 cursor-pointer place-items-center rounded-chip text-caption font-medium',
                          'transition-transform duration-(--duration-fast) ease-standard hover:scale-105',
                          levelClass[cell.level],
                          // Hoje: o anel ocupa até 4px para fora; o contorno de foco começa depois dele.
                          cell.isToday && 'ring-2 ring-foreground ring-offset-2 ring-offset-card focus-visible:outline-offset-4',
                        )}
                      >
                        {cell.day}
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-caption text-muted-foreground" aria-hidden="true">
            Menos
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <span key={level} className={cn('size-3 rounded-chip', levelClass[level])} />
            ))}
            Mais
          </div>

          {peak ? (
            <p className="text-body-sm text-muted-foreground">
              O dia que mais pesou foi {formatDayShort(peak.date)}, com {formatBrl(peak.expense)}.
            </p>
          ) : null}
        </div>
      ) : (
        <DataTable
          caption="Gasto por dia do mês"
          columns={['Dia', 'Gasto', 'Gastos']}
          rowKeys={pastCells.map((cell) => cell.date)}
          rows={pastCells.map((cell) => [formatDayShort(cell.date), formatBrl(cell.expense), cell.expenseCount])}
        />
      )}
    </PanelCard>
  )
}
