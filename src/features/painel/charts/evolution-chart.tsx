import { formatBrl } from '@/domain/money'
import { monthLabel } from '@/domain/month'
import { plotLeft } from '@/features/painel/charts/layout'
import { ChartTooltipCard } from '@/features/painel/charts/chart-tooltip'
import { formatCompactBrl } from '@/features/painel/format'
import type { MonthPoint } from '@/features/painel/model'
import { readDuration } from '@/features/painel/motion'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'
import { useState, type CSSProperties } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from 'recharts'

const tick = { fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-sans)' }
const Y_AXIS_WIDTH = 64
const MARGIN = { top: 8, right: 8, left: 0, bottom: 4 }
const PLOT = { left: MARGIN.left + Y_AXIS_WIDTH, right: MARGIN.right }

function monthTitle(key: string): string {
  return monthLabel(key).replace(/ de \d{4}$/, '')
}

/**
  Evolução (spec 4.6): barras de receita/gasto e a linha de saldo, mês a mês. O mês aberto
  fica a 100%, os outros a 40%. Os rótulos do eixo X são botões de verdade, alinhados às
  colunas (a faixa de categorias divide a largura igualmente): Tab chega neles, o foco
  mostra a dica daquela coluna, Enter/clique abre o painel naquele mês.
*/
export function EvolutionChart({
  months,
  activeKey,
  onSelectMonth,
  summary,
}: {
  months: MonthPoint[]
  activeKey: string
  onSelectMonth: (key: string) => void
  summary: string
}) {
  const reducedMotion = usePrefersReducedMotion()
  const [hovered, setHovered] = useState<number | null>(null)
  const count = months.length
  const point = hovered !== null ? months[hovered] : undefined
  const animation = { isAnimationActive: !reducedMotion, animationDuration: readDuration('--duration-chart') }
  const columnWidth = `calc((100% - ${PLOT.left + PLOT.right}px) / ${count})`
  const columnLeft = (index: number) => plotLeft(index / count, PLOT)

  function indexOf(state: MouseHandlerDataParam): number | null {
    const index = Number(state.activeTooltipIndex)
    return Number.isInteger(index) && index >= 0 && index < count ? index : null
  }

  return (
    <div role="group" aria-label={summary} className="grid gap-1">
      <div className="relative h-56 w-full sm:h-64" aria-hidden="true">
        {point && hovered !== null ? (
          <div
            className="absolute top-2 bottom-1 z-0 rounded-chip bg-chart-cursor/60"
            style={{ left: columnLeft(hovered), width: columnWidth }}
          />
        ) : null}
        <div className="relative z-10 size-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={months}
              margin={MARGIN}
              barGap={2}
              barCategoryGap="24%"
              accessibilityLayer={false}
              onMouseMove={(state) => setHovered(indexOf(state))}
              onMouseLeave={() => setHovered(null)}
              onClick={(state) => {
                const index = indexOf(state)
                const target = index === null ? undefined : months[index]
                if (target && target.key !== activeKey) onSelectMonth(target.key)
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="label" hide />
              <YAxis
                width={Y_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tick={tick}
                tickFormatter={(value: number) => formatCompactBrl(value)}
              />
              <Tooltip content={() => null} cursor={false} isAnimationActive={false} />
              <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={18} {...animation}>
                {months.map((item) => (
                  <Cell key={item.key} fillOpacity={item.key === activeKey ? 1 : 0.4} className="cursor-pointer" />
                ))}
              </Bar>
              <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={18} {...animation}>
                {months.map((item) => (
                  <Cell key={item.key} fillOpacity={item.key === activeKey ? 1 : 0.4} className="cursor-pointer" />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--foreground)"
                strokeWidth={2}
                {...animation}
                activeDot={false}
                dot={(props: { cx?: number; cy?: number; index?: number; payload?: MonthPoint }) =>
                  props.cx != null && props.cy != null ? (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      strokeWidth={2}
                      stroke="var(--foreground)"
                      // Saldo negativo: ponto vazado (forma, não só cor).
                      fill={(props.payload?.balance ?? 0) < 0 ? 'var(--card)' : 'var(--foreground)'}
                    />
                  ) : (
                    <g key={props.index} />
                  )
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {point && hovered !== null ? (
          <EvolutionTooltip
            point={point}
            className={cn('absolute top-2 z-20', hovered / count > 0.5 ? '-translate-x-[calc(100%+0.5rem)]' : 'translate-x-2')}
            style={{ left: hovered / count > 0.5 ? columnLeft(hovered) : columnLeft(hovered + 1) }}
          />
        ) : null}
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, paddingLeft: PLOT.left, paddingRight: PLOT.right }}
      >
        {months.map((item, index) => {
          const isOpen = item.key === activeKey
          return (
            <button
              key={item.key}
              type="button"
              aria-current={isOpen ? 'date' : undefined}
              aria-label={`${monthLabel(item.key)}: receitas ${formatBrl(item.income)}, gastos ${formatBrl(item.expense)}, saldo ${formatBrl(item.balance)}.${isOpen ? '' : ' Abrir o painel deste mês.'}`}
              onClick={() => {
                if (!isOpen) onSelectMonth(item.key)
              }}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              className={cn(
                'mx-auto flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-1 text-caption transition-colors duration-(--duration-fast) pointer-coarse:h-11 pointer-coarse:min-w-11',
                isOpen ? 'font-semibold text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EvolutionTooltip({
  point,
  className,
  style,
}: {
  point: MonthPoint
  className?: string
  style?: CSSProperties
}) {
  const savings = point.income > 0 ? Math.round((point.balance / point.income) * 100) : null
  return (
    <ChartTooltipCard
      title={monthTitle(point.key)}
      className={className}
      style={style}
      lines={[
        { label: 'Receitas', value: `+ ${formatBrl(point.income)}`, color: 'var(--income)', style: 'bar' },
        { label: 'Gastos', value: `− ${formatBrl(point.expense)}`, color: 'var(--expense)', style: 'bar' },
      ]}
      footer={
        <span className="flex justify-between gap-4">
          <span>Saldo</span>
          <span className={cn('figure', point.balance < 0 && 'text-expense')}>
            {point.balance < 0 ? '−' : '+'} {formatBrl(Math.abs(point.balance))}
            {savings === null ? '' : point.balance >= 0 ? ` (guardaram ${savings}%)` : ' (gastaram mais do que entrou)'}
          </span>
        </span>
      }
    />
  )
}
