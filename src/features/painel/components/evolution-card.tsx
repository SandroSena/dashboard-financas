import { formatBrl } from '@/domain/money'
import { monthLabel } from '@/domain/month'
import { DataTable } from '@/features/painel/charts/data-table'
import { EvolutionChart } from '@/features/painel/charts/evolution-chart'
import { PanelCard } from '@/features/painel/components/panel-card'
import { VIEW_OPTIONS, type ChartView } from '@/features/painel/components/view-options'
import type { MonthPoint } from '@/features/painel/model'
import type { HistoryWindow } from '@/features/painel/params'
import { EmptyState } from '@/shared/components/feedback'
import { cn } from '@/shared/lib/utils'
import { Segmented } from '@/shared/ui/segmented'
import { CalendarRange } from 'lucide-react'
import { useState } from 'react'

const WINDOW_OPTIONS = [
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
] as const

/**
  Evolução (spec 4.6): receitas, gastos e saldo da janela (6 ou 12 meses, `?janela=`).
  Clicar num mês abre o painel nele. Os 12 meses já vêm na mesma consulta (UX-35).
*/
export function EvolutionCard({
  months,
  activeKey,
  window,
  onWindowChange,
  onSelectMonth,
  className,
}: {
  months: MonthPoint[]
  activeKey: string
  window: HistoryWindow
  onWindowChange: (next: HistoryWindow) => void
  onSelectMonth: (key: string) => void
  className?: string
}) {
  const [view, setView] = useState<ChartView>('chart')
  const monthsWithData = months.filter((point) => point.count > 0).length
  const best = months.reduce<MonthPoint | null>((top, point) => (top === null || point.balance > top.balance ? point : top), null)
  const summary = `Evolução de ${window} meses: receitas, gastos e saldo por mês.${
    best && monthsWithData > 0 ? ` Maior saldo em ${monthLabel(best.key)}, ${formatBrl(best.balance)}.` : ''
  } Os rótulos dos meses abrem o painel naquele mês.`

  return (
    <PanelCard
      title="Evolução"
      description="Receitas, gastos e saldo mês a mês. O mês aberto fica em destaque."
      className={className}
      actions={
        <>
          <Segmented
            label="Janela da evolução"
            size="sm"
            value={String(window) as '6' | '12'}
            onChange={(next) => onWindowChange(Number(next) as HistoryWindow)}
            options={WINDOW_OPTIONS}
          />
          <Segmented label="Modo de visualização da evolução" iconOnly size="sm" value={view} onChange={setView} options={VIEW_OPTIONS} />
        </>
      }
    >
      {monthsWithData < 2 ? (
        <EmptyState
          variant="compact"
          icon={<CalendarRange />}
          title="Ainda não há histórico para comparar."
          description="Ele aparece a partir do segundo mês com lançamentos."
        />
      ) : view === 'chart' ? (
        <>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-muted-foreground" aria-hidden="true">
            <Legend color="bg-income" label="Receitas" />
            <Legend color="bg-expense" label="Gastos" />
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full bg-foreground" />
              Saldo
            </span>
          </div>
          <div className={cn(window === 12 && '-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0')}>
            <div className={cn(window === 12 && 'min-w-160 sm:min-w-0')}>
              <EvolutionChart months={months} activeKey={activeKey} onSelectMonth={onSelectMonth} summary={summary} />
            </div>
          </div>
        </>
      ) : (
        <DataTable
          caption="Receitas, gastos e saldo por mês"
          columns={['Mês', 'Receitas', 'Gastos', 'Saldo']}
          rowKeys={months.map((point) => point.key)}
          rows={months.map((point) => [
            monthLabel(point.key),
            formatBrl(point.income),
            formatBrl(point.expense),
            <span key="saldo" className={point.balance < 0 ? 'text-expense' : undefined}>
              {formatBrl(point.balance)}
            </span>,
          ])}
        />
      )}
    </PanelCard>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn('size-2.5 rounded-chip', color)} />
      {label}
    </span>
  )
}
