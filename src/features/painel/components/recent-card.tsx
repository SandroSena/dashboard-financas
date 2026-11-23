import type { Category, Transaction } from '@/domain/types'
import { useDashboardActions } from '@/features/painel/actions-context'
import { CardLink } from '@/features/painel/components/card-parts'
import { PanelSection } from '@/features/painel/components/panel-card'
import { TransactionList } from '@/features/painel/components/transaction-list'
import { transactionsLink } from '@/features/painel/links'
import { EmptyState } from '@/shared/components/feedback'
import { Button } from '@/shared/ui/button'
import { Plus, Receipt } from 'lucide-react'

/** Lançamentos recentes (spec 4.9): a linha inteira abre a edição; ao salvar, a linha pisca. */
export function RecentCard({
  transactions,
  categoryById,
  month,
}: {
  transactions: Transaction[]
  categoryById: ReadonlyMap<string, Category>
  month: string
}) {
  const actions = useDashboardActions()
  return (
    <PanelSection
      title="Lançamentos recentes"
      description="Os últimos movimentos do mês."
      action={<CardLink to={transactionsLink(month)}>Ver todos</CardLink>}
    >
      {transactions.length === 0 ? (
        <EmptyState
          variant="compact"
          className="rounded-card border border-dashed border-input"
          icon={<Receipt />}
          title="Nada lançado neste mês."
          action={
            <Button variant="outline" size="sm" onClick={() => actions.newTransaction()} disabled={!actions.canAdd}>
              <Plus aria-hidden="true" />
              Novo lançamento
            </Button>
          }
        />
      ) : (
        <TransactionList transactions={transactions} categoryById={categoryById} />
      )}
    </PanelSection>
  )
}
