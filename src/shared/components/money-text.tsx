import { formatBrl } from '@/domain/money'
import { cn } from '@/shared/lib/utils'

/**
  Valor em reais numa linha de texto, com algarismos tabulares (`figure`).
  `balance` pinta pelo sinal; o sinal "−" já vem do formato, então a cor nunca vai sozinha.
*/
export function MoneyText({
  value,
  tone = 'default',
  className,
}: {
  value: number
  tone?: 'default' | 'income' | 'expense' | 'balance'
  className?: string
}) {
  const toneClass =
    tone === 'income'
      ? 'text-income'
      : tone === 'expense'
        ? 'text-expense'
        : tone === 'balance'
          ? value >= 0
            ? 'text-income'
            : 'text-expense'
          : undefined

  return <span className={cn('figure', toneClass, className)}>{formatBrl(value)}</span>
}
