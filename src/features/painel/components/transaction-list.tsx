import { formatBrl } from '@/domain/money'
import { toIsoDate } from '@/domain/month'
import type { Category, Transaction } from '@/domain/types'
import { useDashboardActions } from '@/features/painel/actions-context'
import { formatDayShort } from '@/features/painel/format'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { RowFlash } from '@/shared/components/row-flash'
import { flashTokenFor } from '@/shared/lib/row-flash'
import { cn } from '@/shared/lib/utils'
import { useEffect, useRef } from 'react'

function relativeDay(iso: string): string {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso === toIsoDate(today)) return 'Hoje'
  if (iso === toIsoDate(yesterday)) return 'Ontem'
  return formatDayShort(iso)
}

/**
  Lançamentos agrupados por dia em que a linha inteira é um botão que abre a edição
  (spec 4.9). Diferente do `TransactionGroups` de Lançamentos, que tem ações por linha.
  Candidata a `shared/components` (variante clicável) quando Lançamentos precisar.

  @param highlightId linha marcada em `brand-soft` e focada (folha do dia vinda de "Maior gasto").
*/
export function TransactionList({
  transactions,
  categoryById,
  highlightId,
  groupByDay = true,
  className,
}: {
  transactions: Transaction[]
  categoryById: ReadonlyMap<string, Category>
  highlightId?: string | null
  groupByDay?: boolean
  className?: string
}) {
  const groups: Array<{ date: string; items: Transaction[] }> = []
  for (const transaction of transactions) {
    const last = groups.at(-1)
    if (groupByDay && last?.date === transaction.occurredOn) last.items.push(transaction)
    else if (groupByDay || groups.length === 0) groups.push({ date: transaction.occurredOn, items: [transaction] })
    else last?.items.push(transaction)
  }

  return (
    <div className={cn('overflow-hidden rounded-card bg-card py-1 shadow-edge', className)}>
      {groups.map((group) => (
        <div key={group.date} className="border-t border-border first:border-t-0">
          {groupByDay ? <p className="eyebrow px-4 pt-3 pb-1">{relativeDay(group.date)}</p> : null}
          <ul className="grid">
            {group.items.map((transaction) => (
              <li key={transaction.id}>
                <TransactionRow
                  transaction={transaction}
                  category={categoryById.get(transaction.categoryId)}
                  highlighted={transaction.id === highlightId}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TransactionRow({
  transaction,
  category,
  highlighted,
}: {
  transaction: Transaction
  category: Category | undefined
  highlighted: boolean
}) {
  const actions = useDashboardActions()
  const isIncome = transaction.kind === 'income'
  const ref = useRef<HTMLButtonElement>(null)
  const signed = `${isIncome ? '+' : '−'} ${formatBrl(transaction.amount)}`

  useEffect(() => {
    if (!highlighted) return
    // Depois do foco automático da folha (que vai para o título), a linha marcada recebe o foco.
    const timer = window.setTimeout(() => ref.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [highlighted])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => actions.editTransaction(transaction)}
      aria-label={`Editar ${transaction.description}, ${signed}, ${formatDayShort(transaction.occurredOn)}`}
      aria-current={highlighted ? 'true' : undefined}
      className={cn(
        'relative isolate flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-accent/50',
        highlighted && 'bg-brand-soft hover:bg-brand-soft',
      )}
    >
      <RowFlash token={flashTokenFor(actions.flash, transaction.id)} behind />
      <CategoryAvatar name={category?.name} color={category?.color} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium">{transaction.description}</span>
        <span className="block truncate text-caption text-muted-foreground">{category?.name ?? 'Sem categoria'}</span>
      </span>
      <span className={cn('figure shrink-0 text-right text-body font-semibold', isIncome ? 'text-income' : 'text-foreground')}>
        {signed}
      </span>
    </button>
  )
}
