import { cn } from '@/shared/lib/utils'
import { controlClass } from '@/shared/ui/control'
import { useFieldControl } from '@/shared/ui/field-context'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

const inputClass = cn(controlClass, 'read-only:bg-sunken')

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  const field = useFieldControl(props)
  return <input className={cn(inputClass, className)} {...props} {...field} />
}

/** Senha com botão de mostrar/esconder (40px, `aria-pressed`). */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  const field = useFieldControl(props)
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cn(inputClass, 'pr-12', className)} {...props} {...field} />
      <button
        type="button"
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

/**
  Valor em reais: prefixo "R$" fora do texto digitado.
  `size="lg"` é o campo grande do formulário de lançamento (`numeral`, 24px).
*/
export function MoneyInput({
  className,
  size = 'md',
  ...props
}: Omit<ComponentProps<'input'>, 'type' | 'size'> & { size?: 'md' | 'lg' }) {
  const field = useFieldControl(props)
  const large = size === 'lg'
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground',
          large ? 'font-display text-lead' : 'text-body-sm',
        )}
        aria-hidden="true"
      >
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn(inputClass, large ? 'numeral h-14 pl-12 text-heading font-semibold sm:h-14' : 'figure pl-10', className)}
        {...props}
        {...field}
      />
    </div>
  )
}

/** Busca: ícone de lupa e botão de limpar quando há texto. */
export function SearchInput({
  className,
  value,
  onValueChange,
  clearLabel = 'Limpar busca',
  ...props
}: Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
  clearLabel?: string
}) {
  const field = useFieldControl(props)
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        className={cn(inputClass, 'pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden', className)}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        {...props}
        {...field}
      />
      {value ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onValueChange('')}
          className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
