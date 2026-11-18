import { formatBrl } from '@/domain/money'
import { FALLBACK_COLOR, type CategorySlice } from '@/domain/summary'
import type { DayFlow, FlowPoint, MonthPoint, ScatterPoint, StackSeries, WeekdayPoint } from '@/features/painel/model'
import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts'

const tick = { fill: 'var(--muted-foreground)', fontSize: 12 }
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export function ChartBox({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('h-72 w-full', className)} role="img" aria-label={label}>
      {children}
    </div>
  )
}

export function EmptyChart({ message }: { message: string }) {
  return <p className="grid h-72 place-items-center px-6 text-center text-sm text-muted-foreground">{message}</p>
}


function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
      {label !== undefined ? <p className="mb-1 text-muted-foreground">{label}</p> : null}
      <div className="grid gap-1">
        {payload.map((item) => (
          <p key={String(item.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-medium tabular-nums">{formatBrl(Number(item.value ?? 0))}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({
  data,
  dataKey,
  color,
}: {
  data: MonthPoint[]
  dataKey: 'income' | 'expense' | 'balance'
  color: string
}) {
  return (
    <div className="h-10 w-24" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.18} strokeWidth={1.6} dot={false} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthComposed({ months }: { months: MonthPoint[] }) {
  return (
    <ChartBox label="Receitas, gastos e saldo nos últimos seis meses">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
          <YAxis tickLine={false} axisLine={false} tick={tick} width={48} tickFormatter={(value) => compact.format(Number(value))} />
          <Tooltip content={<MoneyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Receitas" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" name="Gastos" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Line dataKey="balance" name="Saldo" stroke="var(--foreground)" strokeWidth={2} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function CumulativeArea({ flow }: { flow: FlowPoint[] }) {
  return (
    <ChartBox label="Receitas e gastos acumulados no mês" className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={flow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tick} interval={4} />
          <YAxis tickLine={false} axisLine={false} tick={tick} width={48} tickFormatter={(value) => compact.format(Number(value))} />
          <Tooltip content={<MoneyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area dataKey="income" name="Receitas" stroke="var(--income)" fill="var(--income)" fillOpacity={0.2} strokeWidth={2} type="monotone" />
          <Area dataKey="expense" name="Gastos" stroke="var(--expense)" fill="var(--expense)" fillOpacity={0.18} strokeWidth={2} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function StackedCategoryArea({
  points,
  series,
}: {
  points: Array<Record<string, string | number>>
  series: StackSeries[]
}) {
  return (
    <ChartBox label="Gastos por categoria nos últimos seis meses">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
          <YAxis tickLine={false} axisLine={false} tick={tick} width={48} tickFormatter={(value) => compact.format(Number(value))} />
          <Tooltip content={<MoneyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((item) => (
            <Area
              key={item.id}
              dataKey={item.id}
              name={item.name}
              stackId="gastos"
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.86}
              type="monotone"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function RankBars({ slices }: { slices: CategorySlice[] }) {
  const rows = slices.slice(0, 6)
  return (
    <ChartBox label="Maiores gastos por categoria">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tickLine={false}
            axisLine={false}
            tick={tick}
            tickFormatter={(value) => clip(String(value), 16)}
          />
          <Tooltip content={<MoneyTooltip />} />
          <Bar dataKey="total" name="Gasto" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {rows.map((slice) => (
              <Cell key={slice.categoryId} fill={slice.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function WeekdayBars({ days }: { days: WeekdayPoint[] }) {
  return (
    <ChartBox label="Receitas e gastos por dia da semana">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
          <YAxis tickLine={false} axisLine={false} tick={tick} width={48} tickFormatter={(value) => compact.format(Number(value))} />
          <Tooltip content={<MoneyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Receitas" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={16} />
          <Bar dataKey="expense" name="Gastos" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function DailyNetLine({ days }: { days: DayFlow[] }) {
  return (
    <ChartBox label="Saldo de cada dia do mês">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tick} interval={4} />
          <YAxis tickLine={false} axisLine={false} tick={tick} width={48} tickFormatter={(value) => compact.format(Number(value))} />
          <Tooltip content={<MoneyTooltip />} />
          <Line dataKey="net" name="Saldo do dia" stroke="var(--foreground)" strokeWidth={2} dot={false} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function SharePie({
  slices,
  total,
  label,
  donut = false,
}: {
  slices: CategorySlice[]
  total: number
  label: string
  donut?: boolean
}) {
  return (
    <div className="relative h-64" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="total"
            nameKey="name"
            innerRadius={donut ? 68 : 0}
            outerRadius={96}
            paddingAngle={slices.length > 1 ? 2 : 0}
            stroke="none"
          >
            {slices.map((slice) => (
              <Cell key={slice.categoryId} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<MoneyTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {donut ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-lg font-semibold tabular-nums">{formatBrl(total)}</span>
        </div>
      ) : null}
    </div>
  )
}

export function BudgetRadial({
  items,
}: {
  items: { name: string; value: number; percent: number; fill: string }[]
}) {
  return (
    <ChartBox label="Uso das metas" className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="18%"
          outerRadius="100%"
          barSize={14}
          data={items}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background dataKey="value" cornerRadius={8}>
            {items.map((item) => (
              <Cell key={item.name} fill={item.fill} />
            ))}
          </RadialBar>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0]?.payload as { name?: string; percent?: number; fill?: string }
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
                  <p className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </p>
                  <p className="font-medium tabular-nums">{item.percent ?? 0}% da meta</p>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function SavingsRing({ percent }: { percent: number }) {
  const shown = Math.max(0, Math.min(percent, 100))
  return (
    <div className="relative h-40" role="img" aria-label={`Taxa de poupança ${percent}%`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="68%"
          outerRadius="100%"
          data={[{ name: 'Poupança', value: shown, fill: percent >= 0 ? 'var(--income)' : 'var(--expense)' }]}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-semibold tabular-nums', percent >= 0 ? 'text-income' : 'text-expense')}>
          {percent}%
        </span>
        <span className="text-xs text-muted-foreground">da receita</span>
      </div>
    </div>
  )
}

export function BudgetRadar({ points }: { points: { name: string; gasto: number; meta: number }[] }) {
  return (
    <ChartBox label="Gasto contra a meta por categoria">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={points} outerRadius="70%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
          <Radar name="Gasto" dataKey="gasto" stroke="var(--expense)" fill="var(--expense)" fillOpacity={0.35} />
          <Radar name="Meta" dataKey="meta" stroke="var(--income)" fill="var(--income)" fillOpacity={0.15} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip content={<MoneyTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function SpendTreemap({ slices }: { slices: CategorySlice[] }) {
  const data = slices.map((slice) => ({ name: slice.name, size: slice.total, fill: slice.color }))
  return (
    <ChartBox label="Peso de cada categoria nos gastos">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={data} dataKey="size" nameKey="name" stroke="var(--background)" aspectRatio={1.4} isAnimationActive={false}>
          <Tooltip content={<MoneyTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function ExpenseScatter({ points }: { points: ScatterPoint[] }) {
  const groups = new Map<string, { name: string; fill: string; points: ScatterPoint[] }>()
  for (const point of points) {
    const current = groups.get(point.category) ?? { name: point.category, fill: point.fill, points: [] }
    current.points.push(point)
    groups.set(point.category, current)
  }
  const ranked = [...groups.values()].sort(
    (left, right) => sumAmounts(right.points) - sumAmounts(left.points),
  )
  const visible = ranked.slice(0, 6)
  const rest = ranked.slice(6)
  if (rest.length > 0) {
    visible.push({
      name: 'Outros',
      fill: FALLBACK_COLOR,
      points: rest.flatMap((group) => group.points.map((point) => ({ ...point, fill: FALLBACK_COLOR }))),
    })
  }

  return (
    <ChartBox label="Cada gasto do mês, por dia e valor">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis dataKey="day" type="number" name="Dia" domain={[1, 31]} tickLine={false} axisLine={false} tick={tick} />
          <YAxis
            dataKey="amount"
            type="number"
            name="Valor"
            tickLine={false}
            axisLine={false}
            tick={tick}
            width={48}
            tickFormatter={(value) => compact.format(Number(value))}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0]?.payload as ScatterPoint | undefined
              if (!item) return null
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
                  <p>{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.category} · dia {item.day}
                  </p>
                  <p className="font-medium tabular-nums">{formatBrl(item.amount)}</p>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {visible.map((group) => (
            <Scatter key={group.name} name={group.name} data={group.points} fill={group.fill} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

function sumAmounts(points: ScatterPoint[]): number {
  return points.reduce((total, point) => total + point.amount, 0)
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
