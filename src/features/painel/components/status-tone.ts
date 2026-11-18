import type { BudgetStatus } from '@/domain/types'
import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'

/** Cor da barra, cor do texto e ícone de cada status de meta. */
export const statusTone: Record<BudgetStatus, { bar: string; text: string; icon: LucideIcon }> = {
  ok: { bar: 'bg-income', text: 'text-income', icon: CircleCheck },
  warning: { bar: 'bg-warning', text: 'text-warning', icon: TriangleAlert },
  over: { bar: 'bg-expense', text: 'text-expense', icon: CircleX },
}
