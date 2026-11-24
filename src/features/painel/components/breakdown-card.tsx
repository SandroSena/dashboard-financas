import { formatBrl } from '@/domain/money'
import type { Kind } from '@/domain/types'
import { useDashboardActions } from '@/features/painel/actions-context'
import { PanelCard } from '@/features/painel/components/panel-card'
import { formatPercent } from '@/features/painel/format'
import type { CategoryBreakdown, CategoryRow, ComparisonCopy, DashboardInsights } from '@/features/painel/insights'
import { CategoryDot } from '@/shared/components/category-avatar'
import { Delta } from '@/shared/components/delta'
import { EmptyState } from '@/shared/components/feedback'
import { categoryColorVar } from '@/shared/lib/category-colors'
import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/ui/progress'
import { Segmented } from '@/shared/ui/segmented'
import { ChevronDown, ChevronRight, Receipt } from 'lucide-react'
import { useId, useState } from 'react'

const KIND_OPTIONS = [
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Receitas' },
] as const

/**
  Para onde foi o dinheiro (spec 4.5): faixa 100% (decorativa para o leitor de tela,
  interativa para o mouse) + lista ordenada de botões. Passar numa linha destaca o
  segmento; passar num segmento destaca a linha. "Outras (n)" abre na própria lista.
*/
export function BreakdownCard({
  insights,
  copy,
  className,
}: {
  insights: DashboardInsights
  copy: ComparisonCopy
  className?: string
}) {
  const [kind, setKind] = useState<Kind>('expense')
  const [hovered, setHovered] = useState<string | null>(null)
  const [othersOpen, setOthersOpen] = useState(false)
  const breakdown = kind === 'expense' ? insights.expenseBreakdown : insights.incomeBreakdown
  const segments = breakdown.others ? [...breakdown.rows, breakdown.others] : breakdown.rows
  const max = segments.reduce((peak, row) => Math.max(peak, row.total), 0)
  const hasComparison = insights.comparison !== null
  const othersId = useId()

  return (
    <PanelCard
      title="Para onde foi o dinheiro"
      className={className}
      description={
        breakdown.total > 0
          ? `${formatBrl(breakdown.total)} em ${kind === 'expense' ? 'gastos' : 'receitas'}, por categoria.`
          : kind === 'expense'
            ? 'Gastos do mês por categoria.'
            : 'Receitas do mês por categoria.'
      }
      actions={
        <Segmented
          label="Tipo da divisão por categoria"
          size="sm"
          value={kind}
          onChange={(next) => {
            setKind(next)
            setOthersOpen(false)
            setHovered(null)
          }}
          options={KIND_OPTIONS}
        />
      }
    >
      {segments.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={<Receipt />}
          title={kind === 'expense' ? 'Nenhum gasto neste mês ainda.' : 'Nenhuma receita neste mês ainda.'}
        />
      ) : (
        <div className="grid gap-5">
          <div className="flex h-4 gap-0.5" aria-hidden="true" onPointerLeave={() => setHovered(null)}>
            {segments.map((row, index) => (
              <span
                key={row.categoryId}
                onPointerEnter={() => setHovered(row.categoryId)}
                className={cn(
                  'h-full min-w-1.5 transition-opacity duration-(--duration-base) ease-standard',
                  index === 0 ? 'rounded-l-full' : 'rounded-l-chip',
                  index === segments.length - 1 ? 'rounded-r-full' : 'rounded-r-chip',
                  hovered !== null && hovered !== row.categoryId && 'opacity-35',
                )}
                style={{ backgroundColor: categoryColorVar(row.color), flexGrow: Math.max(row.share, 0.001) }}
              />
            ))}
          </div>

          <ul className="-mx-2 grid gap-0.5">
            {breakdown.rows.map((row) => (
              <li key={row.categoryId}>
                <CategoryRowButton
                  row={row}
                  max={max}
                  kind={breakdown.kind}
                  hasComparison={hasComparison}
                  copy={copy}
                  highlighted={hovered === row.categoryId}
                  onHover={setHovered}
                />
              </li>
            ))}
            {breakdown.others ? (
              <li>
                <OthersRow
                  breakdown={breakdown}
                  max={max}
                  open={othersOpen}
                  onToggle={() => setOthersOpen((value) => !value)}
                  highlighted={hovered === breakdown.others.categoryId}
                  onHover={setHovered}
                  controlsId={othersId}
                />
                {othersOpen ? (
                  <ul id={othersId} className="ml-4 grid gap-0.5 border-l border-border pl-2">
                    {breakdown.others.items.map((row) => (
                      <li key={row.categoryId}>
                        <CategoryRowButton
                          row={row}
                          max={max}
                          kind={breakdown.kind}
                          hasComparison={hasComparison}
                          copy={copy}
                          highlighted={false}
                          onHover={() => setHovered(breakdown.others?.categoryId ?? null)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </PanelCard>
  )
}

const rowClass =
  'grid w-full min-h-12 cursor-pointer gap-1.5 rounded-control px-2 py-2 text-left transition-colors duration-(--duration-base) ease-standard hover:bg-accent/50 focus-visible:bg-accent/50'

function RowFigures({ row }: { row: CategoryRow }) {
  return (
    <span className="flex shrink-0 items-baseline gap-2">
      <span className="figure font-semibold">{formatBrl(row.total)}</span>
      <span className="figure w-9 text-right text-caption text-muted-foreground">{formatPercent(row.share)}</span>
    </span>
  )
}

function CategoryRowButton({
  row,
  max,
  kind,
  hasComparison,
  copy,
  highlighted,
  onHover,
}: {
  row: CategoryRow
  max: number
  kind: Kind
  hasComparison: boolean
  copy: ComparisonCopy
  highlighted: boolean
  onHover: (id: string | null) => void
}) {
  const actions = useDashboardActions()
  return (
    <button
      type="button"
      className={cn(rowClass, highlighted && 'bg-accent/50')}
      onClick={() => actions.openCategory(row.categoryId)}
      onPointerEnter={() => onHover(row.categoryId)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(row.categoryId)}
      onBlur={() => onHover(null)}
    >
      <span className="flex items-center justify-between gap-3 text-body-sm">
        <span className="flex min-w-0 items-center gap-2">
          <CategoryDot color={row.color} />
          <span className="truncate font-medium">{row.name}</span>
          {hasComparison ? (
            <Delta
              value={row.change}
              unit="percent"
              goodWhen={kind === 'expense' ? 'down' : 'up'}
              comparison={copy.phrase}
              label=""
              emptyLabel={row.isNew ? 'Nova neste mês' : ''}
              className="shrink-0"
            />
          ) : null}
        </span>
        <RowFigures row={row} />
      </span>
      <Progress value={row.total} max={max} color={categoryColorVar(row.color)} size="sm" />
    </button>
  )
}

function OthersRow({
  breakdown,
  max,
  open,
  onToggle,
  highlighted,
  onHover,
  controlsId,
}: {
  breakdown: CategoryBreakdown
  max: number
  open: boolean
  onToggle: () => void
  highlighted: boolean
  onHover: (id: string | null) => void
  controlsId: string
}) {
  const others = breakdown.others
  if (!others) return null
  const Icon = open ? ChevronDown : ChevronRight
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controlsId}
      className={cn(rowClass, highlighted && 'bg-accent/50')}
      onClick={onToggle}
      onPointerEnter={() => onHover(others.categoryId)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(others.categoryId)}
      onBlur={() => onHover(null)}
    >
      <span className="flex items-center justify-between gap-3 text-body-sm">
        <span className="flex min-w-0 items-center gap-2">
          <CategoryDot color={others.color} />
          <span className="truncate font-medium">{others.name}</span>
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </span>
        <RowFigures row={others} />
      </span>
      <Progress value={others.total} max={max} color={categoryColorVar(others.color)} size="sm" />
    </button>
  )
}
