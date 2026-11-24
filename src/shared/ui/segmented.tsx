import { cn } from '@/shared/lib/utils'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'

/** Teclas com que o Radix move o foco dentro do grupo. Só elas selecionam no foco. */
const ROVING_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Ícone opcional. Com `iconOnly`, o rótulo vira `aria-label` e dica (`title`). */
  icon?: LucideIcon
  /** Cor do texto quando ativa (opção com significado: Gasto/Receita). */
  tone?: 'income' | 'expense'
  disabled?: boolean
}

/**
  Escolha de um valor entre 2–4 opções (design system 10.6), sobre o Radix ToggleGroup:
  `role="radiogroup"`, um só ponto de Tab (foco itinerante), setas movem E selecionam
  (padrão ARIA de radiogroup), Tab sai do grupo. Nunca fica sem opção marcada.
  Substitui o Segmented antigo, o ViewToggle e o LayoutSwitcher.
*/
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  iconOnly = false,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<SegmentedOption<T>>
  /** Nome do grupo para o leitor de tela (ex.: "Tipo de lançamento"). */
  label: string
  iconOnly?: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  /*
    O foco só seleciona quando veio de uma seta (padrão de radiogroup). Com Tab/Shift+Tab
    o Radix pode pôr o foco no item antigo (o tab stop não acompanha uma mudança externa
    do valor, como "Limpar filtros"), e selecionar ali mudaria o filtro sozinho.
  */
  const arrowNav = useRef(false)

  function select(next: string) {
    // Radix devolve '' ao clicar na opção já ativa: o grupo nunca fica vazio.
    if (next && next !== value) onChange(next as T)
  }

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={select}
      aria-label={label}
      loop
      onKeyDown={(event) => {
        arrowNav.current = ROVING_KEYS.has(event.key)
      }}
      className={cn('inline-flex rounded-full bg-sunken p-1', className)}
    >
      {options.map((option) => {
        const Icon = option.icon
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            // Setas movem o foco (Radix); aqui o foco vindo de seta também seleciona.
            onFocus={() => {
              if (!arrowNav.current) return
              arrowNav.current = false
              if (!option.disabled) select(option.value)
            }}
            className={cn(
              'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap text-muted-foreground',
              'transition-[background-color,color,box-shadow] duration-(--duration-base) ease-standard hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-45',
              'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-edge',
              option.tone === 'income' && 'data-[state=on]:text-income',
              option.tone === 'expense' && 'data-[state=on]:text-expense',
              iconOnly
                ? size === 'sm'
                  ? 'size-8 flex-none pointer-coarse:size-11'
                  : 'size-9 flex-none pointer-coarse:size-11'
                : size === 'sm'
                  ? 'h-8 px-3 text-body-sm pointer-coarse:h-11'
                  : 'h-9 px-4 text-body-sm pointer-coarse:h-11',
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
            {iconOnly ? null : option.label}
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup.Root>
  )
}
