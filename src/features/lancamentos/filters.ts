import { formatBrl, toCents } from '@/domain/money'
import { isIsoDate, toIsoDate } from '@/domain/month'
import type { Category, Kind, Transaction } from '@/domain/types'
import { readParam, uuidParam, withParam, type ParamParser } from '@/shared/hooks/use-search-param'

/*
  Regras puras da tela de Lançamentos (docs/design/telas/lancamentos.md).
  Contrato da URL, fixo porque o painel gera links assim:
  /lancamentos?mes=AAAA-MM&tipo=gastos|receitas&categoria=<uuid>&busca=<texto>
*/

export type KindFilter = 'todos' | 'gastos' | 'receitas'

export const KIND_FILTER_DEFAULT: KindFilter = 'todos'

const KIND_ALIASES: Record<string, KindFilter> = {
  todos: 'todos',
  gastos: 'gastos',
  receitas: 'receitas',
  // Aceitos por robustez (a auditoria AC-17 cita `tipo=expense`); a URL é reescrita no formato oficial.
  expense: 'gastos',
  income: 'receitas',
}

export const kindFilterParam: ParamParser<KindFilter> = (raw) => KIND_ALIASES[raw.toLowerCase()] ?? null

export const SEARCH_MAX_LENGTH = 80

/** Texto livre: corta espaços e limita o tamanho; vazio vira padrão. */
export const searchParam: ParamParser<string> = (raw) => {
  const text = raw.trim().slice(0, SEARCH_MAX_LENGTH)
  return text ? text : null
}

export function kindOfFilter(filter: KindFilter): Kind | null {
  if (filter === 'gastos') return 'expense'
  if (filter === 'receitas') return 'income'
  return null
}

export function filterOfKind(kind: Kind): KindFilter {
  return kind === 'expense' ? 'gastos' : 'receitas'
}

export type TransactionFilters = {
  tipo: KindFilter
  categoria: string | null
  busca: string
}

/** Lê os filtros da URL. Qualquer valor inválido cai no padrão sem quebrar (AC-17). */
export function readFilters(params: URLSearchParams): TransactionFilters {
  return {
    tipo: readParam(params, 'tipo', kindFilterParam, KIND_FILTER_DEFAULT),
    categoria: readParam<string | null>(params, 'categoria', uuidParam, null),
    busca: readParam(params, 'busca', searchParam, ''),
  }
}

/**
  Grava os filtros mantendo os outros parâmetros (`mes`). Valores padrão saem da URL,
  para o link ficar curto: sem filtro, sobra só `?mes=`.
*/
export function writeFilters(params: URLSearchParams, filters: TransactionFilters): URLSearchParams {
  let next = withParam(params, 'tipo', filters.tipo, KIND_FILTER_DEFAULT)
  next = withParam(next, 'categoria', filters.categoria)
  next = withParam(next, 'busca', filters.busca.trim().slice(0, SEARCH_MAX_LENGTH) || null)
  return next
}

/** A URL tem algo que não está no formato oficial (ex.: `tipo=expense`, `categoria=abc`)? */
export function needsCanonicalUrl(params: URLSearchParams): boolean {
  const canonical = writeFilters(params, readFilters(params))
  const keys = ['tipo', 'categoria', 'busca']
  return keys.some((key) => (params.get(key) ?? null) !== (canonical.get(key) ?? null))
}

export type CategoryCheck =
  | { status: 'ok'; filters: TransactionFilters }
  | { status: 'missing'; filters: TransactionFilters }
  | { status: 'kind-adjusted'; filters: TransactionFilters }

/**
  Confere a categoria da URL contra as categorias da conta (AC-15/AC-16: um id de outra
  conta não vem no RLS e conta como inexistente).
  - Inexistente: o filtro sai (a tela avisa "Essa categoria não existe mais.").
  - De outro tipo (ex.: `tipo=receitas` com uma categoria de gasto): a categoria é o pedido
    mais específico, então o tipo passa a ser o dela.
*/
export function checkCategoryFilter(filters: TransactionFilters, categories: readonly Category[]): CategoryCheck {
  if (!filters.categoria) return { status: 'ok', filters }
  const category = categories.find((item) => item.id === filters.categoria)
  if (!category) return { status: 'missing', filters: { ...filters, categoria: null } }
  const kind = kindOfFilter(filters.tipo)
  if (kind !== null && kind !== category.kind) {
    return { status: 'kind-adjusted', filters: { ...filters, tipo: filterOfKind(category.kind) } }
  }
  return { status: 'ok', filters }
}

/** Trocar o tipo limpa a categoria quando ela não é do novo tipo (spec, seção 2). */
export function changeKind(
  filters: TransactionFilters,
  tipo: KindFilter,
  categories: readonly Category[],
): TransactionFilters {
  const kind = kindOfFilter(tipo)
  const category = filters.categoria ? categories.find((item) => item.id === filters.categoria) : undefined
  const keepCategory = Boolean(category) && (kind === null || category?.kind === kind)
  return { ...filters, tipo, categoria: keepCategory ? filters.categoria : null }
}

export const EMPTY_FILTERS: TransactionFilters = { tipo: KIND_FILTER_DEFAULT, categoria: null, busca: '' }

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return filters.tipo !== KIND_FILTER_DEFAULT || filters.categoria !== null || filters.busca.trim() !== ''
}

/** Minúsculas e sem acento, para "farm" achar "Farmácia" e "FARMÁCIA" (UX-53). */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function filterTransactions(transactions: readonly Transaction[], filters: TransactionFilters): Transaction[] {
  const kind = kindOfFilter(filters.tipo)
  const needle = normalizeSearch(filters.busca)
  return transactions.filter((transaction) => {
    if (kind !== null && transaction.kind !== kind) return false
    if (filters.categoria && transaction.categoryId !== filters.categoria) return false
    if (needle && !normalizeSearch(transaction.description).includes(needle)) return false
    return true
  })
}

export type Totals = { expenseCents: number; incomeCents: number; balanceCents: number }

/** Totais da lista, somados em centavos. */
export function totalsOf(transactions: readonly Transaction[]): Totals {
  let expenseCents = 0
  let incomeCents = 0
  for (const transaction of transactions) {
    if (transaction.kind === 'expense') expenseCents += toCents(transaction.amount)
    else incomeCents += toCents(transaction.amount)
  }
  return { expenseCents, incomeCents, balanceCents: incomeCents - expenseCents }
}

export type DayGroup = {
  date: string
  items: Transaction[]
  /** Receitas menos gastos do dia, em centavos. */
  netCents: number
}

/** Agrupa por dia, mantendo a ordem recebida (o repository já devolve do mais novo ao mais antigo). */
export function groupByDay(transactions: readonly Transaction[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const transaction of transactions) {
    const signed = transaction.kind === 'income' ? toCents(transaction.amount) : -toCents(transaction.amount)
    const last = groups.at(-1)
    if (last?.date === transaction.occurredOn) {
      last.items.push(transaction)
      last.netCents += signed
    } else {
      groups.push({ date: transaction.occurredOn, items: [transaction], netCents: signed })
    }
  }
  return groups
}

const WEEKDAYS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'] as const
const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'] as const

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Cabeçalho do dia: "Hoje", "Ontem" ou "qui., 12 nov.". */
export function dayHeading(iso: string, today = new Date()): string {
  if (!isIsoDate(iso)) return iso
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso === toIsoDate(today)) return 'Hoje'
  if (iso === toIsoDate(yesterday)) return 'Ontem'
  const date = parseIso(iso)
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

/** "12 de nov.", para o rótulo da linha no leitor de tela. */
export function spokenDate(iso: string): string {
  if (!isIsoDate(iso)) return iso
  const date = parseIso(iso)
  return `${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}`
}

export function signedAmountText(transaction: Pick<Transaction, 'kind' | 'amount'>): string {
  return `${transaction.kind === 'income' ? '+' : '−'} ${formatBrl(transaction.amount)}`
}

/** "Editar Pão de Açúcar, Mercado, − R$ 86,00, 12 de nov." (linha inteira no celular). */
export function rowEditLabel(transaction: Transaction, categoryName: string | undefined): string {
  return `Editar ${transaction.description}, ${categoryName ?? 'Sem categoria'}, ${signedAmountText(transaction)}, ${spokenDate(transaction.occurredOn)}`
}

/** "1 lançamento na lista" / "45 lançamentos na lista". */
export function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'lançamento' : 'lançamentos'} na lista`
}

/** Mês (AAAA-MM) da data, se for diferente do mês aberto; senão `null` (UX-57). */
export function otherMonthOf(occurredOn: string, month: string): string | null {
  const target = occurredOn.slice(0, 7)
  return target === month ? null : target
}
