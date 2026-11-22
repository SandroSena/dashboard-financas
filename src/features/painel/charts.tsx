import { formatBrl } from '@/domain/money'
import { capitalize } from '@/domain/month'
import type { CategoryShare, PacePoint } from '@/features/painel/insights'
import type { MonthPoint } from '@/features/painel/model'
import { formatCompactBrl, formatPercent } from '@/features/painel/format'
import { cn } from '@/shared/lib/utils'
import { useId, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tick = { fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-sans)' }
type TooltipRow = { label: string; value: number; color: string; dashed?: boolean }

function TooltipCard({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-48 rounded-lg bg-popover px-3.5 py-2.5 text-sm shadow-[0_12px_32px_-12px_rgb(0_0_0/0.4)] ring-1 ring-border">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="grid gap-1">
        {rows.map((row) => (
          <p key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className={cn('h-1 w-3 rounded-full', row.dashed && 'opacity-60')}
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="font-medium tabular-nums">{formatBrl(row.value)}</span>
          </p>
        ))}
      </div>
      {footer ? <div className="mt-1.5 border-t pt-1.5 text-xs text-muted-foreground">{footer}</div> : null}
    </div>
  )
}

export function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      {dashed ? (
        <span className="flex w-4 gap-0.5" aria-hidden="true">
          <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: color }} />
          <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: color }} />
        </span>
      ) : (
        <span className="h-1 w-4 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      )}
      {label}
    </span>
  )
}

function dayTicks(totalDays: number): number[] {
  return [1, 5, 10, 15, 20, 25, totalDays].filter((day, index, list) => day <= totalDays && list.indexOf(day) === index)
}

export function SpendingPace({
  points,
  totalDays,
  previousLabel = 'mês anterior',
}: {
  points: PacePoint[]
  totalDays: number
  previousLabel?: string
}) {
  const gradientId = useId().replace(/:/g, '')
  const peak = points.reduce(
    (max, point) => Math.max(max, point.current ?? 0, point.previous ?? 0, point.projected ?? 0),
    0,
  )
  const domainMax = peak * 1.08 || 100

  return (
    <div className="h-72 w-full" role="img" aria-label="Gasto acumulado no mês comparado ao mês anterior">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="day"
            type="number"
            domain={[1, totalDays]}
            ticks={dayTicks(totalDays)}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={tick}
          />
          <YAxis
            width={64}
            domain={[0, domainMax]}
            tickLine={false}
            axisLine={false}
            tick={tick}
            tickFormatter={(value: number) => formatCompactBrl(value)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as PacePoint | undefined
              if (!point) return null
              const rows: TooltipRow[] = []
              if (point.current !== null) rows.push({ label: 'Este mês', value: point.current, color: 'var(--expense)' })
              if (point.projected !== null && point.current === null)
                rows.push({ label: 'Projeção', value: point.projected, color: 'var(--expense)', dashed: true })
              if (point.previous !== null)
                rows.push({ label: capitalize(previousLabel), value: point.previous, color: 'var(--chart-muted)' })
              const diff = point.current !== null && point.previous !== null ? point.current - point.previous : null
              return (
                <TooltipCard
                  title={`Até o dia ${label}`}
                  rows={rows}
                  footer={
                    diff === null ? null : diff > 0 ? (
                      <>{formatBrl(diff)} a mais que em {previousLabel}</>
                    ) : diff < 0 ? (
                      <>{formatBrl(-diff)} a menos que em {previousLabel}</>
                    ) : (
                      <>Igual a {previousLabel}</>
                    )
                  }
                />
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="var(--chart-muted)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--expense)"
            strokeOpacity={0.6}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="var(--expense)"
            strokeWidth={2.25}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthlyBars({ months, activeKey }: { months: MonthPoint[]; activeKey: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Receitas e gastos dos últimos seis meses">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={months} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--border)' }} tick={tick} />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={tick}
            tickFormatter={(value: number) => formatCompactBrl(value)}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.7, radius: 8 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as MonthPoint | undefined
              if (!point) return null
              return (
                <TooltipCard
                  title={point.label}
                  rows={[
                    { label: 'Receitas', value: point.income, color: 'var(--income)' },
                    { label: 'Gastos', value: point.expense, color: 'var(--expense)' },
                  ]}
                  footer={
                    <span className="flex justify-between gap-4">
                      Saldo
                      <span className={cn('font-medium tabular-nums', point.balance >= 0 ? 'text-income' : 'text-expense')}>
                        {formatBrl(point.balance)}
                      </span>
                    </span>
                  }
                />
              )
            }}
          />
          <Bar dataKey="income" name="Receitas" fill="var(--income)" radius={[6, 6, 2, 2]} maxBarSize={20} animationDuration={500}>
            {months.map((point) => (
              <Cell key={point.key} fillOpacity={point.key === activeKey ? 1 : 0.35} />
            ))}
          </Bar>
          <Bar dataKey="expense" name="Gastos" fill="var(--expense)" radius={[6, 6, 2, 2]} maxBarSize={20} animationDuration={500}>
            {months.map((point) => (
              <Cell key={point.key} fillOpacity={point.key === activeKey ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
  Tendência curta dentro de um indicador. A linha fica no tom discreto; só o mês aberto
  (o último ponto) ganha a cor do indicador, para o olho saber onde está "agora".
*/
export function Sparkline({ values, color, className }: { values: number[]; color: string; className?: string }) {
  const gradientId = useId().replace(/:/g, '')
  if (values.every((value) => value === 0)) return <div className={cn('h-10', className)} aria-hidden="true" />
  const data = values.map((value, index) => ({ index, value }))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.35 || Math.abs(max) * 0.1 || 1
  const low = min >= 0 ? Math.max(0, min - pad) : min - pad
  const high = max + pad * 0.35
  const last = data.length - 1
  return (
    <div className={cn('h-10 w-full', className)} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 2, bottom: 4 }}>
          <YAxis hide domain={[low, high]} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-muted)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === last && props.cx != null && props.cy != null ? (
                <circle
                  key="last"
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  fill={color}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryBreakdown({ items }: { items: CategoryShare[] }) {
  const max = items.reduce((peak, item) => Math.max(peak, item.total), 0)
  return (
    <div className="grid gap-5">
      <div className="flex h-4 gap-1 overflow-hidden rounded-full" aria-hidden="true">
        {items.map((item) => (
          <span
            key={item.categoryId}
            className="h-full rounded-[3px] first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: item.color, width: `${Math.max(item.share * 100, 1.5)}%` }}
            title={`${item.name}: ${formatPercent(item.share)}`}
          />
        ))}
      </div>
      <ul className="grid gap-3.5">
        {items.map((item) => (
          <li key={item.categoryId} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="font-semibold tabular-nums">{formatBrl(item.total)}</span>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPercent(item.share)}
                </span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-track">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-fluid"
                style={{ backgroundColor: item.color, width: `${max > 0 ? (item.total / max) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: string[]
  rows: Array<Array<ReactNode>>
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg ring-1 ring-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            {columns.map((column, index) => (
              <th key={column} scope="col" className={cn('px-3 py-2 font-medium', index === 0 ? 'text-left' : 'text-right')}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cn('px-3 py-1.5 tabular-nums', cellIndex === 0 ? 'text-left' : 'text-right')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
