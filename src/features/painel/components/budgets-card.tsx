import { formatBrl, toCents } from '@/domain/money'
import { monthName } from '@/domain/month'
import type { BudgetUsage } from '@/domain/summary'
import { STATUS_LABEL } from '@/features/orcamentos/model'
import { statusTone } from '@/features/orcamentos/status-tone'
import { useDashboardActions } from '@/features/painel/actions-context'
import { CardLink } from '@/features/painel/components/card-parts'
import { PanelSection } from '@/features/painel/components/panel-card'
import type { DashboardInsights } from '@/features/painel/insights'
import { budgetsLink } from '@/features/painel/links'
import { CategoryDot } from '@/shared/components/category-avatar'
import { EmptyState, QueryError } from '@/shared/components/feedback'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Target } from 'lucide-react'
import { Link } from 'react-router'

const MAX_ROWS = 5
const progressTone = { ok: 'income', warning: 'warning', over: 'expense' } as const

/**
  Metas por categoria (spec 4.8): até 5 linhas, estouradas primeiro. Cada linha abre a folha
  da categoria. Erro só das metas fica aqui dentro; o resto do painel continua (UX-45).
*/
export function BudgetsCard({
  usage,
  month,
  insights,
  error,
  onRetry,
  animate,
}: {
  usage: BudgetUsage[]
  month: string
  insights: DashboardInsights
  error: string | null
  onRetry: () => void
  animate: boolean
}) {
  const actions = useDashboardActions()

  return (
    <PanelSection
      title="Metas por categoria"
      description="A partir de 80% do limite a meta entra em alerta."
      action={<CardLink to={budgetsLink(month)}>Ajustar metas</CardLink>}
    >
      {error ? (
        <QueryError variant="compact" title="As metas não carregaram." message={error} onRetry={onRetry} />
      ) : usage.length === 0 ? (
        <EmptyState
          variant="compact"
          className="rounded-card border border-dashed border-input"
          icon={<Target />}
          title={`Nenhuma meta para ${monthName(month)}.`}
          description="Definam um limite por categoria para acompanhar aqui."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to={budgetsLink(month)}>Definir metas</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2">
          <ul className="surface grid gap-1 rounded-card p-2 sm:p-3">
            {usage.slice(0, MAX_ROWS).map((item) => {
              const tone = statusTone[item.status]
              const StatusIcon = tone.icon
              const remainingCents = toCents(item.budget.limitAmount) - toCents(item.spent)
              const remaining = remainingCents / 100
              const perDay =
                insights.isCurrentMonth && remainingCents > 0 && insights.daysLeft > 0
                  ? Math.round(remainingCents / insights.daysLeft) / 100
                  : null
              return (
                <li key={item.budget.id}>
                  <button
                    type="button"
                    onClick={() => actions.openCategory(item.budget.categoryId)}
                    className="grid w-full cursor-pointer gap-2 rounded-control px-3 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-accent/50"
                  >
                    <span className="flex items-baseline justify-between gap-3 text-body-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <CategoryDot color={item.color} />
                        <span className="truncate font-semibold">{item.categoryName}</span>
                      </span>
                      <span className="figure shrink-0 text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatBrl(item.spent)}</span> de{' '}
                        {formatBrl(item.budget.limitAmount)}
                      </span>
                    </span>
                    <Progress value={item.percent} tone={progressTone[item.status]} animateOnMount={animate} />
                    <span className="flex items-center justify-between gap-3 text-caption">
                      <span className={cn('flex items-center gap-1 font-semibold', tone.text)}>
                        <StatusIcon className="size-3.5" aria-hidden="true" />
                        {STATUS_LABEL[item.status]}, {item.percent}%
                      </span>
                      <span className="figure text-muted-foreground">
                        {remaining >= 0 ? `Restam ${formatBrl(remaining)}` : `Passou ${formatBrl(-remaining)}`}
                      </span>
                    </span>
                    {perDay !== null ? (
                      <span className="text-caption text-muted-foreground">Cabem {formatBrl(perDay)}/dia até o fim do mês</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
          {usage.length > MAX_ROWS ? (
            <CardLink to={budgetsLink(month)}>Ver todas as {usage.length} metas</CardLink>
          ) : null}
        </div>
      )}
    </PanelSection>
  )
}
