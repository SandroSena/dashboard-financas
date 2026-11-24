import { monthBounds } from '@/domain/month'
import type { Kind, Transaction } from '@/domain/types'
import { getSupabase, listAllPages, requireUserId, toDataError } from '@/shared/lib/supabase'

type TransactionRow = {
  id: string
  category_id: string
  kind: Kind
  description: string
  amount: number | string
  occurred_on: string
}

export type TransactionInput = {
  categoryId: string
  kind: Kind
  description: string
  amount: number
  occurredOn: string
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    categoryId: row.category_id,
    kind: row.kind,
    description: row.description,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
  }
}

const TRANSACTION_COLUMNS = 'id, category_id, kind, description, amount, occurred_on'

// Ordem total e estável (termina em `id`, que é único) para a paginação não
// repetir nem pular linhas entre páginas.
export async function listTransactions(monthKey: string): Promise<Transaction[]> {
  const { start, end } = monthBounds(monthKey)
  const rows = await listAllPages<TransactionRow>(
    (from, to) =>
      getSupabase()
        .from('transactions')
        .select(TRANSACTION_COLUMNS)
        .gte('occurred_on', start)
        .lte('occurred_on', end)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to),
    'Não foi possível carregar os lançamentos.',
  )
  return rows.map(mapTransaction)
}

export async function listTransactionsBetween(start: string, end: string): Promise<Transaction[]> {
  const rows = await listAllPages<TransactionRow>(
    (from, to) =>
      getSupabase()
        .from('transactions')
        .select(TRANSACTION_COLUMNS)
        .gte('occurred_on', start)
        .lte('occurred_on', end)
        .order('occurred_on', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to),
    'Não foi possível carregar os lançamentos.',
  )
  return rows.map(mapTransaction)
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const userId = await requireUserId()
  const { data, error } = await getSupabase()
    .from('transactions')
    .insert({
      user_id: userId,
      category_id: input.categoryId,
      kind: input.kind,
      description: input.description,
      amount: input.amount,
      occurred_on: input.occurredOn,
    })
    .select('id, category_id, kind, description, amount, occurred_on')
    .single()

  if (error) throw toDataError(error, 'Não foi possível salvar o lançamento.')
  return mapTransaction(data as TransactionRow)
}

// `update` (e não `upsert`): se o lançamento foi excluído em outra aba, nenhuma
// linha é afetada, o `.single()` devolve PGRST116 ("Registro não encontrado.")
// e o registro não é recriado.
export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const userId = await requireUserId()
  const { data, error } = await getSupabase()
    .from('transactions')
    .update({
      category_id: input.categoryId,
      kind: input.kind,
      description: input.description,
      amount: input.amount,
      occurred_on: input.occurredOn.slice(0, 10),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRANSACTION_COLUMNS)
    .single()

  if (error) throw toDataError(error, 'Não foi possível atualizar o lançamento.')
  return mapTransaction(data as TransactionRow)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await getSupabase().from('transactions').delete().eq('id', id)
  if (error) throw toDataError(error, 'Não foi possível excluir o lançamento.')
}
