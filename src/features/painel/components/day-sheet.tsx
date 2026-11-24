import { formatBrl } from '@/domain/money'
import { useDashboardActions } from '@/features/painel/actions-context'
import { TransactionList } from '@/features/painel/components/transaction-list'
import type { DayDetail } from '@/features/painel/detail'
import { formatWeekdayLong } from '@/features/painel/format'
import { transactionsLink } from '@/features/painel/links'
import { Button } from '@/shared/ui/button'
import { Sheet } from '@/shared/ui/sheet'
import type { Category } from '@/domain/types'
import { ArrowDownRight, ArrowUpRight, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router'

/**
  Folha de detalhe do dia (`?dia=`, spec 4.12): totais, comparação com a média por dia e os
  lançamentos. Vinda de "Maior gasto", a linha dele fica marcada e recebe o foco (UX-40).
*/
export function DaySheet({
  detail,
  open,
  onClose,
  month,
  categoryById,
  highlightId,
}: {
  detail: DayDetail | null
  open: boolean
  onClose: () => void
  month: string
  categoryById: ReadonlyMap<string, Category>
  highlightId: string | null
}) {
  const actions = useDashboardActions()
  if (!detail) return null
  const AverageIcon =
    detail.versusAverage === 'above' ? ArrowUpRight : detail.versusAverage === 'below' ? ArrowDownRight : Minus

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={formatWeekdayLong(detail.date)}
      description={`Dia ${detail.day} de ${detail.totalDays}`}
      footer={
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="link" size="sm" asChild>
            <Link to={transactionsLink(month)}>Ver o mês em Lançamentos</Link>
          </Button>
          <Button variant="secondary" disabled={!actions.canAdd} onClick={() => actions.newTransaction({ date: detail.date })}>
            <Plus aria-hidden="true" />
            Novo lançamento neste dia
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-2">
          <p className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-body-sm text-muted-foreground">
              Saíram <span className="figure text-title-sm font-semibold text-foreground">− {formatBrl(detail.expense)}</span>
            </span>
            <span className="text-body-sm text-muted-foreground">
              Entraram <span className="figure text-title-sm font-semibold text-income">+ {formatBrl(detail.income)}</span>
            </span>
          </p>
          {detail.versusAverage ? (
            <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
              <AverageIcon className="size-4 shrink-0" aria-hidden="true" />
              {detail.versusAverage === 'above'
                ? `Acima da média por dia do mês (${formatBrl(detail.dailyAverage)}).`
                : detail.versusAverage === 'below'
                  ? `Abaixo da média por dia do mês (${formatBrl(detail.dailyAverage)}).`
                  : `Igual à média por dia do mês (${formatBrl(detail.dailyAverage)}).`}
            </p>
          ) : null}
        </div>

        {detail.transactions.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nada lançado neste dia.</p>
        ) : (
          <TransactionList
            transactions={detail.transactions}
            categoryById={categoryById}
            highlightId={highlightId}
            groupByDay={false}
          />
        )}
      </div>
    </Sheet>
  )
}
