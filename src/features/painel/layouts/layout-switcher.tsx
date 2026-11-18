import { useMonthParam } from '@/shared/hooks/use-month-param'
import { cn } from '@/shared/lib/utils'
import { NavLink } from 'react-router'

const options = [
  { to: '/painel', label: 'Atual', end: true },
  { to: '/painel/comando', label: 'Comando', end: false },
  { to: '/painel/fluxo', label: 'Fluxo', end: false },
  { to: '/painel/atlas', label: 'Atlas', end: false },
]

export function LayoutSwitcher() {
  const { month } = useMonthParam()

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Três leituras do mesmo mês. Atual abre o painel de sempre.</p>
      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1">
        {options.map((option) => (
          <NavLink
            key={option.to}
            to={`${option.to}?mes=${month}`}
            end={option.end}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground',
                isActive && 'bg-foreground font-medium text-background',
              )
            }
          >
            {option.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
