import { roundMoney } from '@/domain/money'
import { cn } from '@/shared/lib/utils'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/**
  Valor em reais com hierarquia: o "R$" e os centavos ficam menores e mais leves,
  para o olho pousar nos reais. Leitores de tela recebem o valor inteiro, numa só leitura.
*/
export function Amount({
  value,
  sign,
  className,
  minorClassName,
}: {
  value: number
  /** Mostra "+" ou "−" na frente, mesmo em valores positivos. */
  sign?: 'plus' | 'minus'
  className?: string
  minorClassName?: string
}) {
  const parts = brl.formatToParts(Math.abs(roundMoney(value)))
  const currency = parts.find((part) => part.type === 'currency')?.value ?? 'R$'
  const integer = parts
    .filter((part) => part.type === 'integer' || part.type === 'group')
    .map((part) => part.value)
    .join('')
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? ','
  const fraction = parts.find((part) => part.type === 'fraction')?.value ?? '00'
  const prefix = sign === 'plus' ? '+' : sign === 'minus' || value < 0 ? '−' : ''
  const full = `${prefix}${brl.format(Math.abs(roundMoney(value)))}`

  return (
    <span className={cn('inline-flex items-baseline whitespace-nowrap', className)}>
      <span className="sr-only">{full}</span>
      <span aria-hidden="true" className="contents">
        {prefix ? <span className="mr-[0.06em]">{prefix}</span> : null}
        <span className={cn('mr-[0.18em] text-[0.55em] font-medium opacity-60', minorClassName)}>{currency}</span>
        <span>{integer}</span>
        <span className={cn('text-[0.55em] opacity-60', minorClassName)}>
          {decimal}
          {fraction}
        </span>
      </span>
    </span>
  )
}
