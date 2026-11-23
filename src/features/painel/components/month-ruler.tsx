import { formatBrl } from '@/domain/money'
import { formatPercent } from '@/features/painel/format'
import { RULER_TONE_BG, dayFromPointer, dayKeyAction, dayPosition, rulerTicks, type RulerReading } from '@/features/painel/ruler'
import { cn } from '@/shared/lib/utils'
import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'


/**
  A régua do mês (spec 4.2, a peça-assinatura). `role="slider"` de 1 até o último dia
  vivido: setas, PageUp/PageDown, Home/End, Enter abre o dia, Esc volta para hoje.
  Mouse: passar por cima move o cursor e clicar abre o dia. Toque: arrastar move o cursor
  (`touch-action: pan-y` mantém a rolagem vertical). Mês futuro: só desenho, sem controle.
*/
export function MonthRuler({
  reading,
  hasIncome,
  animate,
  onCursorChange,
  onOpenDay,
}: {
  reading: RulerReading
  hasIncome: boolean
  /** Enche uma vez (`fill-in`) na primeira abertura da sessão. */
  animate: boolean
  onCursorChange: (day: number | null) => void
  onOpenDay: (day: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastPointer = useRef<string>('mouse')
  const { maxDay, totalDays, day } = reading
  const interactive = maxDay > 0
  const showToday = reading.todayPosition !== null
  // O dia de hoje aparece na escala; as marcas vizinhas saem para não encavalar.
  const ticks = rulerTicks(totalDays).filter(
    (tick, index, list) => !showToday || tick === maxDay || index === list.length - 1 || Math.abs(tick - maxDay) > 2,
  )

  function dayAt(event: PointerEvent<HTMLDivElement>): number | null {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return null
    return dayFromPointer(event.clientX - rect.left, rect.width, totalDays, maxDay)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const action = dayKeyAction(event.key, day, maxDay)
    if (!action) return
    event.preventDefault()
    if (action.type === 'move') onCursorChange(action.day)
    else if (action.type === 'open') onOpenDay(day)
    else onCursorChange(null)
  }

  const valueText = hasIncome
    ? `Dia ${day}: saíram ${formatBrl(reading.spent)}, ${formatPercent(reading.share ?? 0)} da receita`
    : `Dia ${day}: saíram ${formatBrl(reading.spent)}`

  const sliderProps = interactive
    ? {
        role: 'slider' as const,
        tabIndex: 0,
        'aria-label': 'Percorrer o mês dia a dia',
        'aria-valuemin': 1,
        'aria-valuemax': maxDay,
        'aria-valuenow': day,
        'aria-valuetext': valueText,
        onKeyDown,
        onBlur: () => onCursorChange(null),
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
          lastPointer.current = event.pointerType
          if (event.pointerType === 'mouse') return
          dragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          onCursorChange(dayAt(event))
        },
        onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
          if (event.pointerType === 'mouse' || dragging.current) onCursorChange(dayAt(event))
        },
        onPointerUp: () => {
          dragging.current = false
        },
        onPointerCancel: () => {
          dragging.current = false
          onCursorChange(null)
        },
        onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
          if (event.pointerType === 'mouse') onCursorChange(null)
        },
        onClick: (event: MouseEvent<HTMLDivElement>) => {
          // Só o mouse abre no clique; no toque, tocar e arrastar só movem o cursor.
          if (lastPointer.current !== 'mouse') return
          const rect = trackRef.current?.getBoundingClientRect()
          const target = rect ? dayFromPointer(event.clientX - rect.left, rect.width, totalDays, maxDay) : null
          if (target !== null) onOpenDay(target)
        },
      }
    : { 'aria-hidden': true as const }

  return (
    <div className="grid gap-1.5">
      <div className="relative pt-8">
        <div
          ref={trackRef}
          {...sliderProps}
          className={cn(
            'relative h-3.5 touch-pan-y rounded-full bg-track select-none sm:h-4',
            interactive && 'cursor-pointer',
          )}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className={cn('size-full', animate && 'fill-in')}>
              <div
                className={cn(
                  'size-full origin-left rounded-full transition-[transform,background-color] duration-(--duration-base) ease-standard',
                  RULER_TONE_BG[reading.tone],
                )}
                style={{ transform: `scaleX(${reading.fill})` }}
              />
            </div>
          </div>

          {reading.comparisonShare !== null && hasIncome ? (
            <span
              className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-chart-muted"
              style={{ left: `${Math.min(reading.comparisonShare, 1) * 100}%` }}
              aria-hidden="true"
            />
          ) : null}

          {reading.todayPosition !== null ? (
            <span
              className="absolute -inset-y-2 w-0.75 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background"
              style={{ left: `${reading.todayPosition * 100}%` }}
              aria-hidden="true"
            />
          ) : null}

          {reading.cursorPosition !== null ? (
            <span
              className="pointer-events-none absolute -inset-y-2 w-0.5 -translate-x-1/2 rounded-full bg-ring"
              style={{ left: `${reading.cursorPosition * 100}%` }}
              aria-hidden="true"
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-popover px-2 py-0.5 text-caption font-semibold whitespace-nowrap shadow-overlay">
                Dia {day}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative h-4 text-caption text-muted-foreground" aria-hidden="true">
        {ticks.map((tick, index, list) => (
          <span
            key={tick}
            className={cn(
              'figure absolute top-0',
              index === list.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
              showToday && tick === maxDay && 'font-semibold text-foreground',
            )}
            style={{ left: `${dayPosition(tick, totalDays) * 100}%` }}
          >
            {tick}
          </span>
        ))}
        {showToday && !ticks.includes(maxDay) ? (
          <span
            className="figure absolute top-0 -translate-x-1/2 font-semibold text-foreground"
            style={{ left: `${(reading.todayPosition ?? 0) * 100}%` }}
          >
            {maxDay}
          </span>
        ) : null}
      </div>
    </div>
  )
}
