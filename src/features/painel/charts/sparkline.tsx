import { cn } from '@/shared/lib/utils'
import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

/**
  Tendência curta dentro de um indicador. A linha fica no tom discreto; só o mês aberto
  (o último ponto) ganha a cor do indicador. Decorativa: os números estão no card.
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
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 2, bottom: 4 }} accessibilityLayer={false}>
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
                <circle key="last" cx={props.cx} cy={props.cy} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
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
