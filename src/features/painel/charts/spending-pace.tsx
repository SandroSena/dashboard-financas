import { formatBrl } from '@/domain/money'
import { plotLeft } from '@/features/painel/charts/layout'
import { ChartTooltipCard, type TooltipLine } from '@/features/painel/charts/chart-tooltip'
import { formatCompactBrl, formatDayLong, isoOfDay, plural } from '@/features/painel/format'
import { paceDiff, type ComparisonCopy, type PacePoint } from '@/features/painel/insights'
import { readDuration } from '@/features/painel/motion'
import { dayKeyAction, rulerTicks } from '@/features/painel/ruler'
import { useMediaQuery, usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useId, type CSSProperties, type KeyboardEvent } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from 'recharts'

export type PaceSeries = 'current' | 'projected' | 'comparison'
export type PaceVisibility = Record<PaceSeries, boolean>

const tick = { fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-sans)' }
const Y_AXIS_WIDTH = 64
const MARGIN = { top: 12, right: 72, left: 0, bottom: 0 }
const PLOT = { left: MARGIN.left + Y_AXIS_WIDTH, right: MARGIN.right }

function indexOf(state: MouseHandlerDataParam): number | null {
  const raw = state.activeTooltipIndex
  if (raw === undefined || raw === null) return null
  const index = Number(raw)
  return Number.isInteger(index) ? index : null
}

/**
  Ritmo de gastos (spec 4.4): acumulado do mês, projeção tracejada e a comparação com
  rótulo direto no fim. O cursor (`activeDay`) é o mesmo da régua: passar o mouse aqui
  move a régua e vice-versa. Clique ou Enter abre a folha do dia.

  O contêiner é focável (`role="group"`) com as mesmas teclas da régua; o SVG é decorativo
  e a tabela (`DataTable`) é a alternativa com os mesmos números.
*/
export function SpendingPace({
  points,
  month,
  maxDay,
  activeDay,
  onActiveDayChange,
  onOpenDay,
  visible,
  copy,
  hasComparison,
  summary,
  onAnnounce,
}: {
  points: PacePoint[]
  month: string
  /** Último dia que já aconteceu (o cursor do teclado não passa dele). */
  maxDay: number
  activeDay: number | null
  onActiveDayChange: (day: number | null) => void
  onOpenDay: (day: number) => void
  visible: PaceVisibility
  copy: ComparisonCopy
  hasComparison: boolean
  /** Frase-resumo lida pelo leitor de tela no lugar do desenho. */
  summary: string
  onAnnounce: (message: string) => void
}) {
  const gradientId = useId().replace(/:/g, '')
  const reducedMotion = usePrefersReducedMotion()
  const finePointer = useMediaQuery('(pointer: fine)')
  const totalDays = points.length
  const animation = { isAnimationActive: !reducedMotion, animationDuration: readDuration('--duration-chart') }

  const showComparison = visible.comparison && hasComparison
  const peak = points.reduce(
    (max, point) =>
      Math.max(
        max,
        visible.current ? (point.current ?? 0) : 0,
        showComparison ? (point.comparison ?? 0) : 0,
        visible.projected ? (point.projected ?? 0) : 0,
      ),
    0,
  )
  const domainMax = peak * 1.08 || 100
  const lastComparisonIndex = points.length - 1

  const active = activeDay !== null ? points[activeDay - 1] : undefined

  function describe(point: PacePoint): string {
    const parts = [`Até ${formatDayLong(isoOfDay(month, point.day))}`]
    if (point.current !== null) parts.push(`este mês ${formatBrl(point.current)}`)
    if (showComparison && point.comparison !== null) parts.push(`${copy.name} ${formatBrl(point.comparison)}`)
    if (point.current === null && point.projected !== null) parts.push(`projeção ${formatBrl(point.projected)}`)
    return `${parts.join(', ')}.`
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const action = dayKeyAction(event.key, activeDay ?? maxDay, maxDay)
    if (!action) return
    event.preventDefault()
    if (action.type === 'move') {
      onActiveDayChange(action.day)
      const point = points[action.day - 1]
      if (point) onAnnounce(describe(point))
    } else if (action.type === 'open') {
      onOpenDay(activeDay ?? maxDay)
    } else {
      onActiveDayChange(null)
    }
  }

  function handleClick(state: MouseHandlerDataParam) {
    const index = indexOf(state)
    const point = index === null ? undefined : points[index]
    if (!point || point.day > maxDay) return
    // No toque, o primeiro toque mostra a dica; o segundo no mesmo dia abre a folha.
    if (!finePointer && activeDay !== point.day) {
      onActiveDayChange(point.day)
      return
    }
    onOpenDay(point.day)
  }

  const fraction = active && totalDays > 1 ? (active.day - 1) / (totalDays - 1) : 0
  const flip = fraction > 0.55

  return (
    <div
      role="group"
      tabIndex={maxDay > 0 ? 0 : -1}
      aria-label={summary}
      aria-roledescription="gráfico"
      aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown Home End Enter Escape"
      onKeyDown={onKeyDown}
      onBlur={() => onActiveDayChange(null)}
      className="relative h-56 w-full cursor-crosshair rounded-control sm:h-72"
    >
      <div className="size-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={MARGIN}
            accessibilityLayer={false}
            onMouseMove={(state) => {
              const index = indexOf(state)
              if (index !== null && points[index]) onActiveDayChange(points[index].day)
            }}
            onMouseLeave={() => onActiveDayChange(null)}
            onClick={handleClick}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, totalDays]}
              ticks={rulerTicks(totalDays)}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={tick}
            />
            <YAxis
              width={Y_AXIS_WIDTH}
              domain={[0, domainMax]}
              tickLine={false}
              axisLine={false}
              tick={tick}
              tickFormatter={(value: number) => formatCompactBrl(value)}
            />
            {/* Só para o Recharts calcular o dia sob o mouse; a dica é desenhada abaixo, em HTML. */}
            <Tooltip content={() => null} cursor={false} isAnimationActive={false} />
            {active ? <ReferenceLine x={active.day} stroke="var(--chart-cursor)" strokeWidth={2} /> : null}
            {showComparison ? (
              <Line
                type="monotone"
                dataKey="comparison"
                stroke="var(--chart-muted)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
                {...animation}
                label={(props: { index?: number; x?: number | string; y?: number | string }) =>
                  props.index === lastComparisonIndex && props.x != null && props.y != null ? (
                    <text
                      key="rotulo"
                      x={Number(props.x) + 8}
                      y={Number(props.y)}
                      dy={4}
                      fill="var(--muted-foreground)"
                      fontSize={12}
                      fontFamily="var(--font-sans)"
                    >
                      {copy.name.length > 9 ? 'Média' : copy.name}
                    </text>
                  ) : (
                    <g key={props.index} />
                  )
                }
              />
            ) : null}
            {visible.projected ? (
              <Line
                type="monotone"
                dataKey="projected"
                stroke="var(--expense)"
                strokeOpacity={0.6}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
                {...animation}
              />
            ) : null}
            {visible.current ? (
              <Area
                type="monotone"
                dataKey="current"
                stroke="var(--expense)"
                strokeWidth={2.25}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={false}
                {...animation}
              />
            ) : null}
            {active && visible.current && active.current !== null ? (
              <ReferenceDot x={active.day} y={active.current} r={5} fill="var(--expense)" stroke="var(--card)" strokeWidth={2} />
            ) : null}
            {active && showComparison && active.comparison !== null ? (
              <ReferenceDot x={active.day} y={active.comparison} r={4} fill="var(--chart-muted)" stroke="var(--card)" strokeWidth={2} />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {active ? (
        <PaceTooltip
          point={active}
          month={month}
          maxDay={maxDay}
          visible={visible}
          showComparison={showComparison}
          copy={copy}
          finePointer={finePointer}
          className={cn('absolute top-2 z-10', flip ? '-translate-x-[calc(100%+0.75rem)]' : 'translate-x-3')}
          style={{ left: plotLeft(fraction, PLOT) }}
        />
      ) : null}
    </div>
  )
}

function PaceTooltip({
  point,
  month,
  maxDay,
  visible,
  showComparison,
  copy,
  finePointer,
  className,
  style,
}: {
  point: PacePoint
  month: string
  maxDay: number
  visible: PaceVisibility
  showComparison: boolean
  copy: ComparisonCopy
  finePointer: boolean
  className?: string
  style?: CSSProperties
}) {
  const lines: TooltipLine[] = []
  if (visible.current && point.current !== null)
    lines.push({ label: 'Este mês', value: formatBrl(point.current), color: 'var(--expense)' })
  if (showComparison && point.comparison !== null)
    lines.push({ label: copy.name, value: formatBrl(point.comparison), color: 'var(--chart-muted)' })
  if (visible.projected && point.projected !== null && point.day > maxDay)
    lines.push({ label: 'Projeção', value: formatBrl(point.projected), color: 'var(--expense)', style: 'dashed' })

  const diff = showComparison && visible.current ? paceDiff(point) : null
  const happened = point.day <= maxDay
  const DiffIcon = diff === null ? null : diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus

  return (
    <ChartTooltipCard
      title={`Até ${formatDayLong(isoOfDay(month, point.day))}`}
      lines={lines}
      className={className}
      style={style}
      extra={
        happened
          ? point.dayCount > 0
            ? `No dia: ${formatBrl(point.dayExpense)} em ${plural(point.dayCount, 'gasto', 'gastos')}`
            : 'No dia: nenhum gasto'
          : undefined
      }
      footer={
        diff !== null && DiffIcon ? (
          <span className={cn('flex items-center gap-1', diff > 0 ? 'text-expense' : diff < 0 ? 'text-income' : 'text-muted-foreground')}>
            <DiffIcon className="size-3.5" aria-hidden="true" />
            {diff === 0 ? `Igual a ${copy.phrase}` : `${formatBrl(Math.abs(diff))} ${diff > 0 ? copy.more : copy.less}`}
          </span>
        ) : undefined
      }
      hint={happened ? (finePointer ? 'Cliquem para ver o dia' : 'Toquem de novo para ver o dia') : undefined}
    />
  )
}
