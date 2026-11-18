import { formatBrl } from '@/domain/money'
import { cn } from '@/shared/lib/utils'

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

  return <span className={cn('tabular-nums', toneClass, className)}>{formatBrl(value)}</span>
}
