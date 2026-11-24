import { defaultDateForMonth, isIsoDate, toIsoDate } from '@/domain/month'
import type { Category, Kind, Transaction } from '@/domain/types'

/** Acima disso, a categoria do diálogo vira select em vez de chips (spec, seção 4). */
export const MAX_CATEGORY_CHIPS = 8

export type Prefill = {
  kind?: Kind
  categoryId?: string
  /** AAAA-MM-DD. */
  occurredOn?: string
}

/**
  Categoria pré-marcada num lançamento novo (UX-55): a última usada no tipo nesta sessão;
  senão a do lançamento mais recente do tipo (a lista vem do mais novo ao mais antigo);
  senão nenhuma. Só vale se a categoria ainda existir e for do tipo.
*/
export function pickDefaultCategory(
  kind: Kind,
  categories: readonly Category[],
  lastUsed: string | undefined,
  recent: readonly Transaction[],
): string {
  const valid = (id: string | undefined) =>
    Boolean(id) && categories.some((category) => category.id === id && category.kind === kind)
  if (valid(lastUsed)) return lastUsed as string
  const latest = recent.find((transaction) => transaction.kind === kind && valid(transaction.categoryId))
  return latest?.categoryId ?? ''
}

export type NewTransactionDefaults = { kind: Kind; categoryId: string; occurredOn: string }

/**
  Valores iniciais de um lançamento novo. Pré-preenchimentos vindos do painel
  (`kind`, `categoryId`, `occurredOn`) vencem; inválidos são ignorados.
  Uma categoria pré-preenchida define o tipo.
*/
export function newTransactionDefaults(
  month: string,
  categories: readonly Category[],
  prefill: Prefill,
  memory: { lastUsed: Partial<Record<Kind, string>>; recent: readonly Transaction[] },
  today = new Date(),
): NewTransactionDefaults {
  const prefilled = prefill.categoryId ? categories.find((category) => category.id === prefill.categoryId) : undefined
  const kind: Kind = prefilled?.kind ?? prefill.kind ?? 'expense'
  const categoryId = prefilled
    ? prefilled.id
    : pickDefaultCategory(kind, categories, memory.lastUsed[kind], memory.recent)
  const occurredOn =
    prefill.occurredOn && isIsoDate(prefill.occurredOn) ? prefill.occurredOn : defaultDateForMonth(month, today)
  return { kind, categoryId, occurredOn }
}

/** Atalhos "Hoje" e "Ontem" do campo de data. */
export function shortcutDate(which: 'today' | 'yesterday', today = new Date()): string {
  if (which === 'today') return toIsoDate(today)
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))
}
