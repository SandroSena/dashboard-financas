import { formatBrl } from '@/domain/money'
import { formatShortDate, toIsoDate } from '@/domain/month'
import { FALLBACK_COLOR } from '@/domain/summary'
import type { Category, Transaction } from '@/domain/types'
import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

function relativeDay(iso: string): string {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso === toIsoDate(today)) return 'Hoje'
  if (iso === toIsoDate(yesterday)) return 'Ontem'
  return formatShortDate(iso)
}

/** Lista agrupada por dia, usada no painel e na tela de lançamentos. */
export function TransactionGroups({
  transactions,
  categories,
  renderActions,
}: {
  transactions: Transaction[]
  categories: Category[]
  renderActions?: (transaction: Transaction) => ReactNode
}) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const groups: Array<{ date: string; items: Transaction[] }> = []
  for (const transaction of transactions) {
    const last = groups.at(-1)
    if (last?.date === transaction.occurredOn) last.items.push(transaction)
    else groups.push({ date: transaction.occurredOn, items: [transaction] })
  }

  return (
    <div className="surface overflow-hidden py-2">
      {groups.map((group) => (
        <div key={group.date} className="border-t border-background pt-1 first:border-t-0 first:pt-0">
          <p className="eyebrow px-4 pt-3 pb-1">{relativeDay(group.date)}</p>
          <ul className="grid">
            {group.items.map((transaction) => {
              const category = byId.get(transaction.categoryId)
              const color = category?.color ?? FALLBACK_COLOR
              const isIncome = transaction.kind === 'income'
              return (
                <li
                  key={transaction.id}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold"
                    style={{ backgroundColor: `${color}24`, color }}
                    aria-hidden="true"
                  >
                    {(category?.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{transaction.description}</p>
                    <p className="truncate text-xs text-muted-foreground">{category?.name ?? 'Sem categoria'}</p>
                  </div>
                  <span
                    className={cn(
                      'figure shrink-0 text-right text-[15px] font-semibold',
                      isIncome ? 'text-income' : 'text-foreground',
                    )}
                  >
                    {isIncome ? '+ ' : '− '}
                    {formatBrl(transaction.amount)}
                  </span>
                  {renderActions ? renderActions(transaction) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
