import { monthName } from '@/domain/month'
import { formatBrl, toCents } from '@/domain/money'
import type { Category, Kind, Transaction } from '@/domain/types'
import { oneOf } from '@/shared/hooks/use-search-param'
import { errorCode } from '@/shared/lib/supabase'

/* Regras puras da tela de Categorias (docs/design/telas/categorias.md). */

export type CategoryTab = 'gastos' | 'receitas'

/** Aba na URL: `?tipo=gastos|receitas` (padrão `gastos`). */
export const categoryTabParam = oneOf(['gastos', 'receitas'] as const)

export function kindOfTab(tab: CategoryTab): Kind {
  return tab === 'receitas' ? 'income' : 'expense'
}

export function tabOfKind(kind: Kind): CategoryTab {
  return kind === 'income' ? 'receitas' : 'gastos'
}

export type MonthStat = { totalCents: number; count: number }

/** Total (centavos) e contagem de lançamentos de cada categoria no mês. */
export function categoryMonthStats(transactions: readonly Transaction[]): Map<string, MonthStat> {
  const stats = new Map<string, MonthStat>()
  for (const transaction of transactions) {
    const current = stats.get(transaction.categoryId) ?? { totalCents: 0, count: 0 }
    current.totalCents += toCents(transaction.amount)
    current.count += 1
    stats.set(transaction.categoryId, current)
  }
  return stats
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/** Maior total do mês primeiro; empate por nome (UX-70). Não muda o array recebido. */
export function sortByMonthTotal(categories: readonly Category[], stats: ReadonlyMap<string, MonthStat>): Category[] {
  return [...categories].sort((left, right) => {
    const difference = (stats.get(right.id)?.totalCents ?? 0) - (stats.get(left.id)?.totalCents ?? 0)
    return difference !== 0 ? difference : collator.compare(left.name, right.name)
  })
}

/** "nov." a partir de "2026-11". */
export function shortMonthName(month: string): string {
  return `${monthName(month).slice(0, 3)}.`
}

/** Linha do card: "R$ 1.240,00 em nov." e "9 lançamentos", ou "Nada em novembro". */
export function monthStatLines(stat: MonthStat | undefined, month: string): { total: string; count: string | null } {
  if (!stat || stat.count === 0) return { total: `Nada em ${monthName(month)}`, count: null }
  return {
    total: `${formatBrl(stat.totalCents / 100)} em ${shortMonthName(month)}`,
    count: `${stat.count} ${stat.count === 1 ? 'lançamento' : 'lançamentos'}`,
  }
}

/** Rótulo da aba para o leitor de tela: "Gastos, 9 categorias". */
export function tabAriaLabel(tab: CategoryTab, count: number): string {
  return `${tab === 'gastos' ? 'Gastos' : 'Receitas'}, ${count} ${count === 1 ? 'categoria' : 'categorias'}`
}

export const NAME_MAX_LENGTH = 40
const COUNTER_FROM = 30

/** Contador do campo Nome, só a partir de 30 caracteres: "32/40". */
export function nameCounter(length: number): string | null {
  return length >= COUNTER_FROM ? `${length}/${NAME_MAX_LENGTH}` : null
}

/*
  Erros do servidor reconhecidos pelo `code` do `DataError` (ver `DataErrorCode` em
  `shared/lib/supabase.ts`), nunca pelo texto da mensagem.
*/

/** Exclusão bloqueada: a categoria tem lançamentos (Postgres 23503). */
export function isInUseError(error: unknown): boolean {
  return errorCode(error) === 'fk_violation'
}

/** Nome repetido na mesma aba (Postgres 23505). */
export function isDuplicateNameError(error: unknown): boolean {
  return errorCode(error) === 'unique_violation'
}

export const DUPLICATE_NAME_TEXT = 'Já existe uma categoria com esse nome.'

/** Toast da exclusão bloqueada (UX-75). */
export function blockedDeleteText(name: string): string {
  return `${name} tem lançamentos e não pode ser excluída. Mudem esses lançamentos de categoria ou excluam-nos antes.`
}

/** "Ver lançamentos" da categoria, no contrato de URL de Lançamentos. */
export function categoryTransactionsHref(month: string, category: Pick<Category, 'id' | 'kind'>): string {
  const params = new URLSearchParams({ mes: month, tipo: category.kind === 'income' ? 'receitas' : 'gastos', categoria: category.id })
  return `/lancamentos?${params.toString()}`
}
