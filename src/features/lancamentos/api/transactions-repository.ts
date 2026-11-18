import { monthBounds } from '@/domain/month'
import type { Kind, Transaction } from '@/domain/types'
import { DataError, getSupabase, mapDbError, requireUserId } from '@/shared/lib/supabase'

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

export async function listTransactions(monthKey: string): Promise<Transaction[]> {
  const { start, end } = monthBounds(monthKey)
  const { data, error } = await getSupabase()
    .from('transactions')
    .select('id, category_id, kind, description, amount, occurred_on')
    .gte('occurred_on', start)
    .lte('occurred_on', end)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new DataError(mapDbError(error, 'Não foi possível carregar os lançamentos.'))
  return ((data ?? []) as TransactionRow[]).map(mapTransaction)
}

export async function listTransactionsBetween(start: string, end: string): Promise<Transaction[]> {
  const { data, error } = await getSupabase()
    .from('transactions')
    .select('id, category_id, kind, description, amount, occurred_on')
    .gte('occurred_on', start)
    .lte('occurred_on', end)
    .order('occurred_on', { ascending: true })

  if (error) throw new DataError(mapDbError(error, 'Não foi possível carregar os lançamentos.'))
  return ((data ?? []) as TransactionRow[]).map(mapTransaction)
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

  if (error) throw new DataError(mapDbError(error, 'Não foi possível salvar o lançamento.'))
  return mapTransaction(data as TransactionRow)
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const userId = await requireUserId()
  const { data, error } = await getSupabase()
    .from('transactions')
    .upsert(
      {
        id,
        user_id: userId,
        category_id: input.categoryId,
        kind: input.kind,
        description: input.description,
        amount: input.amount,
        occurred_on: input.occurredOn.slice(0, 10),
      },
      { onConflict: 'id' },
    )
    .select('id, category_id, kind, description, amount, occurred_on')
    .single()

  if (error) throw new DataError(mapDbError(error, 'Não foi possível atualizar o lançamento.'))
  return mapTransaction(data as TransactionRow)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await getSupabase().from('transactions').delete().eq('id', id)
  if (error) throw new DataError(mapDbError(error, 'Não foi possível excluir o lançamento.'))
}
