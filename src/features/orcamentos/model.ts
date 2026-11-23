import { daysInMonth, monthName, shiftMonth, toIsoDate } from '@/domain/month'
import { parseBrlInput, toCents } from '@/domain/money'
import type { Budget, BudgetStatus, Category, Transaction } from '@/domain/types'

/* Regras puras da tela de Orçamentos (docs/design/telas/orcamentos.md). Dinheiro em centavos. */

/** Alerta a partir de 80% da meta; estourada a partir de 100%. */
export function statusOf(spentCents: number, limitCents: number): BudgetStatus {
  if (limitCents <= 0) return 'ok'
  const ratio = spentCents / limitCents
  return ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok'
}

export function percentOf(spentCents: number, limitCents: number): number {
  return limitCents > 0 ? Math.round((spentCents / limitCents) * 100) : 0
}

export const STATUS_LABEL: Record<BudgetStatus, string> = { ok: 'Em dia', warning: 'Atenção', over: 'Estourada' }

/** `aria-valuetext` do medidor: "83% da meta, em dia" / "120% da meta, estourada". */
export function meterValueText(percent: number, status: BudgetStatus): string {
  return `${percent}% da meta, ${STATUS_LABEL[status].toLowerCase()}`
}

/** Dias que faltam no mês contando hoje; `null` fora do mês atual (o "por dia" só vale nele). */
export function daysLeft(month: string, today = new Date()): number | null {
  const iso = toIsoDate(today)
  if (!iso.startsWith(`${month}-`)) return null
  return daysInMonth(month).length - Number(iso.slice(-2)) + 1
}

/** Quanto cabe por dia, em centavos (arredonda para baixo); `null` se não há o que dividir. */
export function perDayCents(remainingCents: number, days: number | null): number | null {
  if (days === null || days <= 0 || remainingCents <= 0) return null
  return Math.floor(remainingCents / days)
}

function spentByCategoryCents(transactions: readonly Transaction[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') continue
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + toCents(transaction.amount))
  }
  return totals
}

/**
  Média de 3 meses (UX-85): só quando houve gasto em CADA um dos 3 meses anteriores ao
  mês aberto (leitura literal da spec: "teve gasto nos 3 meses anteriores").
  `history` pode trazer qualquer intervalo; só os 3 meses contam.
*/
export function threeMonthAverages(history: readonly Transaction[], month: string): Map<string, number> {
  const months = [1, 2, 3].map((delta) => shiftMonth(month, -delta))
  const perMonth = new Map<string, number[]>()
  for (const transaction of history) {
    if (transaction.kind !== 'expense') continue
    const index = months.indexOf(transaction.occurredOn.slice(0, 7))
    if (index < 0) continue
    const totals = perMonth.get(transaction.categoryId) ?? [0, 0, 0]
    totals[index] += toCents(transaction.amount)
    perMonth.set(transaction.categoryId, totals)
  }
  const averages = new Map<string, number>()
  for (const [categoryId, totals] of perMonth) {
    if (totals.every((total) => total > 0)) {
      averages.set(categoryId, Math.round((totals[0] + totals[1] + totals[2]) / 3))
    }
  }
  return averages
}

export type RowStatus = BudgetStatus | 'none'

export type BudgetRowModel = {
  category: Category
  budget: Budget | undefined
  spentCents: number
  limitCents: number | null
  status: RowStatus
  percent: number
  /** Meta menos gasto; negativo quando passou. `null` sem meta. */
  remainingCents: number | null
  perDayCents: number | null
  /** Média de 3 meses, só para categoria sem meta. */
  suggestionCents: number | null
}

const ORDER: Record<RowStatus, number> = { over: 0, warning: 1, ok: 2, none: 3 }
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/** Uma linha por categoria de gasto. Ordem: estouradas, alerta, em dia, sem meta; dentro, por nome. */
export function buildBudgetRows(
  categories: readonly Category[],
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  options: { month: string; history?: readonly Transaction[]; today?: Date },
): BudgetRowModel[] {
  const spent = spentByCategoryCents(transactions)
  const averages = options.history ? threeMonthAverages(options.history, options.month) : new Map<string, number>()
  const days = daysLeft(options.month, options.today)

  return categories
    .filter((category) => category.kind === 'expense')
    .map((category): BudgetRowModel => {
      const budget = budgets.find((item) => item.categoryId === category.id)
      const spentCents = spent.get(category.id) ?? 0
      if (!budget) {
        return {
          category,
          budget,
          spentCents,
          limitCents: null,
          status: 'none',
          percent: 0,
          remainingCents: null,
          perDayCents: null,
          suggestionCents: averages.get(category.id) ?? null,
        }
      }
      const limitCents = toCents(budget.limitAmount)
      const remainingCents = limitCents - spentCents
      return {
        category,
        budget,
        spentCents,
        limitCents,
        status: statusOf(spentCents, limitCents),
        percent: percentOf(spentCents, limitCents),
        remainingCents,
        perDayCents: perDayCents(remainingCents, days),
        suggestionCents: null,
      }
    })
    .sort((left, right) => ORDER[left.status] - ORDER[right.status] || collator.compare(left.category.name, right.category.name))
}

export type BudgetSummary = {
  limitCents: number
  spentCents: number
  percent: number
  status: BudgetStatus
  remainingCents: number
  perDayCents: number | null
}

/** Resumo do mês, só com as categorias que têm meta (UX-80). `null` sem nenhuma meta. */
export function summarize(rows: readonly BudgetRowModel[], month: string, today?: Date): BudgetSummary | null {
  const withBudget = rows.filter((row) => row.limitCents !== null)
  if (withBudget.length === 0) return null
  const limitCents = withBudget.reduce((sum, row) => sum + (row.limitCents ?? 0), 0)
  const spentCents = withBudget.reduce((sum, row) => sum + row.spentCents, 0)
  const remainingCents = limitCents - spentCents
  return {
    limitCents,
    spentCents,
    percent: percentOf(spentCents, limitCents),
    status: statusOf(spentCents, limitCents),
    remainingCents,
    perDayCents: perDayCents(remainingCents, daysLeft(month, today)),
  }
}

export type StatusFilter = 'todas' | 'estouradas' | 'alerta' | 'em-dia'

const FILTER_STATUS: Record<Exclude<StatusFilter, 'todas'>, BudgetStatus> = {
  estouradas: 'over',
  alerta: 'warning',
  'em-dia': 'ok',
}

export function filterRows(rows: readonly BudgetRowModel[], filter: StatusFilter): BudgetRowModel[] {
  if (filter === 'todas') return [...rows]
  return rows.filter((row) => row.status === FILTER_STATUS[filter])
}

export function statusCounts(rows: readonly BudgetRowModel[]): Record<StatusFilter, number> {
  return {
    todas: rows.length,
    estouradas: rows.filter((row) => row.status === 'over').length,
    alerta: rows.filter((row) => row.status === 'warning').length,
    'em-dia': rows.filter((row) => row.status === 'ok').length,
  }
}

/** Vazio do filtro (UX-87): "Nenhuma meta em alerta em novembro." */
export function emptyFilterText(filter: Exclude<StatusFilter, 'todas'>, month: string): string {
  const what = filter === 'estouradas' ? 'estourada' : filter === 'alerta' ? 'em alerta' : 'em dia'
  return `Nenhuma meta ${what} em ${monthName(month)}.`
}

export type DraftCheck = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'valid'; amount: number }

/** Campo de meta: vazio remove, inválido mostra erro embaixo do campo (UX-82, UX-83). */
export function checkDraft(draft: string): DraftCheck {
  if (!draft.trim()) return { kind: 'empty' }
  const amount = parseBrlInput(draft)
  return amount === null ? { kind: 'invalid' } : { kind: 'valid', amount }
}

/**
  Rascunho do campo de meta quando o valor salvo (`initial`) muda (ex.: depois de salvar,
  ou quando outra aba grava). Campo limpo ou com o mesmo valor do novo salvo acompanha
  o novo valor formatado; campo com outra edição em andamento fica como está.
*/
export function syncDraft(draft: string, previousInitial: string, nextInitial: string): string {
  if (draft.trim() === previousInitial) return nextInitial
  const typed = checkDraft(draft)
  const saved = checkDraft(nextInitial)
  if (typed.kind === 'empty' && saved.kind === 'empty') return nextInitial
  if (typed.kind === 'valid' && saved.kind === 'valid' && Math.round(typed.amount * 100) === Math.round(saved.amount * 100)) {
    return nextInitial
  }
  return draft
}

export const INVALID_DRAFT_TEXT = 'Informem uma meta maior que zero, com até duas casas.'

/**
  Metas do mês anterior que dá para copiar (UX-84): só de categorias de gasto que ainda
  existem e que ainda não têm meta no mês aberto.
*/
export function copyPlan(
  previous: readonly Budget[],
  current: readonly Budget[],
  categories: readonly Category[],
): Array<{ categoryId: string; limitAmount: number }> {
  const expenseIds = new Set(categories.filter((category) => category.kind === 'expense').map((category) => category.id))
  const taken = new Set(current.map((budget) => budget.categoryId))
  return previous
    .filter((budget) => expenseIds.has(budget.categoryId) && !taken.has(budget.categoryId))
    .map((budget) => ({ categoryId: budget.categoryId, limitAmount: budget.limitAmount }))
}

/** Toast da cópia: "6 metas copiadas de outubro." ou, parcial, "4 de 6 metas copiadas. ..." */
export function copyResultText(copied: number, total: number, fromMonth: string): string {
  if (copied === total) return `${total} ${total === 1 ? 'meta copiada' : 'metas copiadas'} de ${monthName(fromMonth)}.`
  return `${copied} de ${total} metas copiadas. Tentem de novo para as que faltaram.`
}
