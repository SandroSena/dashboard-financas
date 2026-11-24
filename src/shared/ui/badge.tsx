import { cn } from '@/shared/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

/**
  Pílula de 22px (design system 10.3). Tom com significado (income, expense, warning)
  sempre vem com ícone ou sinal no conteúdo: cor nunca sozinha.
*/
const badgeVariants = cva(
  'inline-flex h-[1.375rem] shrink-0 items-center gap-1 rounded-full px-2 text-caption font-semibold whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground',
        brand: 'bg-brand-soft text-brand',
        income: 'bg-income-soft text-income',
        expense: 'bg-expense-soft text-expense',
        warning: 'bg-warning-soft text-warning',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
