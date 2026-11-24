import { formatBrl } from '@/domain/money'
import type { Category, Transaction } from '@/domain/types'
import { dayHeading, groupByDay, rowEditLabel } from '@/features/lancamentos/filters'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { RowFlash } from '@/shared/components/row-flash'
import { flashTokenFor, type RowFlashMark } from '@/shared/lib/row-flash'
import { cn } from '@/shared/lib/utils'
import { useId, type ReactNode } from 'react'

/**
  Lista agrupada por dia (design system 10.11), usada no painel e na tela de lançamentos.
  Cada dia é um `ul` com o cabeçalho em `h3`, para navegar por títulos.

  - `renderActions`: botões da linha (desktop). Ficam a 60% e vão a 100% no hover/foco da linha.
  - `onSelect`: a linha inteira vira um botão que abre a edição (celular). Ignora `renderActions`.
  - `dayTotals`: mostra o saldo do dia à direita do cabeçalho.
  - `flash`: a linha recém-criada ou editada acende `brand-soft` e esmaece (`row-flash`).
*/
export function TransactionGroups({
  transactions,
  categories,
  renderActions,
  onSelect,
  dayTotals = false,
  flash,
  className,
}: {
  transactions: Transaction[]
  categories: Category[]
  renderActions?: (transaction: Transaction) => ReactNode
  onSelect?: (transaction: Transaction) => void
  dayTotals?: boolean
  flash?: RowFlashMark
  className?: string
}) {
  const baseId = useId()
  const byId = new Map(categories.map((category) => [category.id, category]))
  const groups = groupByDay(transactions)

  return (
    <div className={cn('surface overflow-hidden py-2', className)}>
      {groups.map((group) => {
        const headingId = `${baseId}-${group.date}`
        return (
          <section key={group.date} aria-labelledby={headingId} className="border-t border-border pt-1 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-1">
              <h3 id={headingId} className="eyebrow">
                {dayHeading(group.date)}
              </h3>
              {dayTotals ? (
                <span className="figure text-caption text-muted-foreground">
                  <span className="sr-only">Saldo do dia: </span>
                  {group.netCents > 0 ? '+ ' : group.netCents < 0 ? '− ' : ''}
                  {formatBrl(Math.abs(group.netCents) / 100)}
                </span>
              ) : null}
            </div>
            <ul className="grid">
              {group.items.map((transaction) => {
                const category = byId.get(transaction.categoryId)
                const content = <RowContent transaction={transaction} category={category} />
                return (
                  <li key={transaction.id} className="group relative">
                    <RowFlash token={flash ? flashTokenFor(flash, transaction.id) : null} />
                    {onSelect ? (
                      <button
                        type="button"
                        aria-label={rowEditLabel(transaction, category?.name)}
                        onClick={() => onSelect(transaction)}
                        className="relative flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-accent/50 focus-visible:-outline-offset-2"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="relative flex min-h-14 items-center gap-3 px-4 py-2 transition-colors duration-(--duration-fast) group-focus-within:bg-accent/50 hover:bg-accent/50">
                        {content}
                        {renderActions ? (
                          <div className="-mr-2 flex shrink-0 opacity-60 transition-opacity duration-(--duration-fast) group-focus-within:opacity-100 group-hover:opacity-100">
                            {renderActions(transaction)}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function RowContent({ transaction, category }: { transaction: Transaction; category: Category | undefined }) {
  const isIncome = transaction.kind === 'income'
  return (
    <>
      <CategoryAvatar name={category?.name} color={category?.color} />
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-body font-medium">{transaction.description}</span>
        <span className="truncate text-caption text-muted-foreground">{category?.name ?? 'Sem categoria'}</span>
      </span>
      <span className={cn('figure shrink-0 text-right text-body font-semibold', isIncome ? 'text-income' : 'text-foreground')}>
        {isIncome ? '+ ' : '− '}
        {formatBrl(transaction.amount)}
      </span>
    </>
  )
}
