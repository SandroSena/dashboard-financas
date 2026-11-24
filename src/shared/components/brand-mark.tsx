import { cn } from '@/shared/lib/utils'

/**
  Logo: duas moedas sobrepostas, o dinheiro da casa contado a dois.
  Fundo `brand-mark` (teal 500 nos dois temas); decorativo (`aria-hidden`):
  o nome "Finanças" sempre aparece escrito ao lado.
*/
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-mark text-brand-mark-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[62%]">
        <circle cx="9.2" cy="12" r="5.6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="14.8" cy="12" r="5.6" fill="currentColor" fillOpacity="0.85" />
      </svg>
    </span>
  )
}

/** Logo + nome, como aparece no menu, no cabeçalho do celular e no login. */
export function BrandLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className={markClassName} />
      <span className="font-display text-title-sm font-semibold tracking-tight">Finanças</span>
    </span>
  )
}
