import { monthName } from '@/domain/month'
import { Button } from '@/shared/ui/button'
import { Tooltip } from '@/shared/ui/tooltip'
import { Plus, Sparkles } from 'lucide-react'

/** Faixa de mês sem lançamentos (spec, seção 5). */
export function EmptyMonth({ month, onAdd, disabled }: { month: string; onAdd: () => void; disabled: boolean }) {
  const button = (
    <Button onClick={() => { if (!disabled) onAdd() }} aria-disabled={disabled || undefined} className="shrink-0">
      <Plus aria-hidden="true" />
      Novo lançamento
    </Button>
  )
  return (
    <div className="flex flex-col items-start gap-4 rounded-card bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground"
          aria-hidden="true"
        >
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="font-display text-title-sm font-semibold">Nada lançado em {monthName(month)} ainda</p>
          <p className="mt-0.5 text-body-sm text-muted-foreground">
            Comecem pela receita do mês e pelos primeiros gastos. O saldo, o ritmo e as metas aparecem logo abaixo.
          </p>
        </div>
      </div>
      {disabled ? <Tooltip content="Carregando categorias...">{button}</Tooltip> : button}
    </div>
  )
}
