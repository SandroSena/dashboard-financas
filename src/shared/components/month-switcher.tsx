import { currentMonthKey, monthLabel, shiftMonth } from '@/domain/month'
import { joinMonthKey, MONTH_SHORT, monthGridTarget, splitMonthKey } from '@/shared/components/month-grid'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { matchesShortcut } from '@/shared/lib/keyboard'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
  Seletor de mês (shell-navegacao.md, seção 4): setas anterior/próximo + botão com o nome
  do mês, que abre a grade 3×4 do ano. Troca de mês faz `push` no histórico (Voltar volta).
  Atalhos globais `[` e `]` (fora de campos e diálogos).

  @param onPrefetch chamado no hover/foco das setas e dos meses da grade, para a tela
    carregar o mês antes do clique (ex.: `prefetchTransactions(month)`).
  @param spendByMonth gasto relativo por mês (`"2026-11" → 0..1`) para a barrinha da grade.
    Só no painel, com o histórico já carregado; sem isso, a grade não mostra barrinhas.
*/
export function MonthSwitcher({
  className,
  onPrefetch,
  spendByMonth,
  shortcuts = true,
}: {
  className?: string
  onPrefetch?: (month: string) => void
  spendByMonth?: Readonly<Record<string, number>>
  shortcuts?: boolean
}) {
  const { month, setMonth } = useMonthParam()
  const today = currentMonthKey()
  const isCurrent = month === today
  const label = monthLabel(month)
  const [open, setOpen] = useState(false)

  const latest = useRef({ month, setMonth })
  useEffect(() => {
    latest.current = { month, setMonth }
  })

  useEffect(() => {
    if (!shortcuts) return
    function onKeyDown(event: KeyboardEvent) {
      const { month: current, setMonth: go } = latest.current
      if (matchesShortcut(event, '[')) {
        event.preventDefault()
        go(shiftMonth(current, -1))
      } else if (matchesShortcut(event, ']')) {
        event.preventDefault()
        go(shiftMonth(current, 1))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcuts])

  const previous = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)

  return (
    <div className={cn('flex w-full flex-wrap items-center gap-1 sm:w-auto', className)}>
      <div className="flex min-w-0 flex-1 items-center rounded-full bg-card p-1 shadow-edge sm:flex-none">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mês anterior"
          aria-keyshortcuts={shortcuts ? '[' : undefined}
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setMonth(previous)}
          onPointerEnter={() => onPrefetch?.(previous)}
          onFocus={() => onPrefetch?.(previous)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Escolher mês: ${label}`}
              className="flex h-10 min-w-36 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-body-sm font-semibold transition-colors duration-(--duration-fast) hover:bg-accent pointer-coarse:h-11"
            >
              {label}
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-(--duration-base) ease-standard',
                  open && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>
          </PopoverTrigger>
          {open ? (
            <MonthGrid
              month={month}
              today={today}
              spendByMonth={spendByMonth}
              onPrefetch={onPrefetch}
              onSelect={(chosen) => {
                setOpen(false)
                if (chosen !== month) setMonth(chosen)
              }}
            />
          ) : null}
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Próximo mês"
          aria-keyshortcuts={shortcuts ? ']' : undefined}
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setMonth(next)}
          onPointerEnter={() => onPrefetch?.(next)}
          onFocus={() => onPrefetch?.(next)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {isCurrent ? null : (
        <Button variant="link" size="sm" className="h-10" onClick={() => setMonth(today)}>
          Voltar para hoje
        </Button>
      )}

      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  )
}

function MonthGrid({
  month,
  today,
  spendByMonth,
  onPrefetch,
  onSelect,
}: {
  month: string
  today: string
  spendByMonth?: Readonly<Record<string, number>>
  onPrefetch?: (month: string) => void
  onSelect: (month: string) => void
}) {
  const selected = splitMonthKey(month)
  const [year, setYear] = useState(selected.year)
  const [focusIndex, setFocusIndex] = useState(selected.index)
  const cells = useRef<Array<HTMLButtonElement | null>>([])

  function focusCell(index: number) {
    setFocusIndex(index)
    cells.current[index]?.focus()
  }

  return (
    <PopoverContent
      aria-label="Escolher mês"
      align="center"
      className="w-70"
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        cells.current[focusIndex]?.focus()
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ano anterior"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setYear((value) => value - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="figure text-body-sm font-semibold" aria-live="polite">
          {year}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Próximo ano"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setYear((value) => value + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {MONTH_SHORT.map((short, index) => {
          const key = joinMonthKey(year, index)
          const isSelected = key === month
          const isToday = key === today
          const spend = spendByMonth?.[key]
          const hasData = spend !== undefined && spend > 0
          return (
            <button
              key={key}
              ref={(element) => {
                cells.current[index] = element
              }}
              type="button"
              tabIndex={index === focusIndex ? 0 : -1}
              aria-label={monthLabel(key)}
              aria-current={isSelected ? 'date' : undefined}
              onClick={() => onSelect(key)}
              onFocus={() => {
                setFocusIndex(index)
                onPrefetch?.(key)
              }}
              onPointerEnter={() => onPrefetch?.(key)}
              onKeyDown={(event) => {
                const target = monthGridTarget(index, event.key)
                if (target === null) return
                event.preventDefault()
                focusCell(target)
              }}
              className={cn(
                'flex h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-control text-body-sm font-medium',
                'transition-colors duration-(--duration-fast) ease-standard',
                isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                !isSelected && isToday && 'inset-ring-2 inset-ring-ring',
                !isSelected && spendByMonth && !hasData && 'text-muted-foreground',
              )}
            >
              <span aria-hidden="true">{short}</span>
              {spendByMonth ? (
                <span className="h-0.75 w-6 overflow-hidden rounded-full bg-current/15" aria-hidden="true">
                  <span
                    className="block h-full origin-left rounded-full bg-current opacity-70"
                    style={{ transform: `scaleX(${Math.min(Math.max(spend ?? 0, 0), 1)})` }}
                  />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </PopoverContent>
  )
}
