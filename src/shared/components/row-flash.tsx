import { cn } from '@/shared/lib/utils'

/**
  Realce da linha recém-salva: fundo `brand-soft` que esmaece (classe `row-flash`,
  `--duration-flash`; com movimento reduzido, `--duration-flash-hold` e some sem
  transição). A `key` é o token do salvamento: um token novo remonta só este realce e a
  animação recomeça, sem remontar a linha (o foco continua onde estava).

  O pai precisa de `relative`. Dentro de um botão, use `behind` e `isolate` no botão,
  para o realce ficar atrás do texto.
*/
export function RowFlash({
  token,
  behind = false,
  className,
}: {
  token: number | null
  behind?: boolean
  /** Ex.: `rounded-card` quando o pai é um card arredondado sem `overflow-hidden`. */
  className?: string
}) {
  if (token === null) return null
  return (
    <span
      key={token}
      aria-hidden="true"
      className={cn('row-flash pointer-events-none absolute inset-0', behind && '-z-10', className)}
    />
  )
}
