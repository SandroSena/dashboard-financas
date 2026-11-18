import type { Budget } from '@/domain/types'
import { DataError, getSupabase, mapDbError, requireUserId } from '@/shared/lib/supabase'

type BudgetRow = {
  id: string
  category_id: string
  month: string
  limit_amount: number | string
}

export type BudgetInput = {
  categoryId: string
  monthKey: string
  limitAmount: number
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    limitAmount: Number(row.limit_amount),
  }
}

export async function listBudgets(monthKey: string): Promise<Budget[]> {
  const { data, error } = await getSupabase()
    .from('budgets')
    .select('id, category_id, month, limit_amount')
    .eq('month', `${monthKey}-01`)

  if (error) throw new DataError(mapDbError(error, 'Não foi possível carregar os orçamentos.'))
  return ((data ?? []) as BudgetRow[]).map(mapBudget)
}

export async function saveBudget(input: BudgetInput): Promise<Budget> {
  const userId = await requireUserId()
  const { data, error } = await getSupabase()
    .from('budgets')
    .upsert(
      {
        user_id: userId,
        category_id: input.categoryId,
        month: `${input.monthKey}-01`,
        limit_amount: input.limitAmount,
      },
      { onConflict: 'user_id,category_id,month' },
    )
    .select('id, category_id, month, limit_amount')
    .single()

  if (error) throw new DataError(mapDbError(error, 'Não foi possível salvar a meta.'))
  return mapBudget(data as BudgetRow)
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await getSupabase().from('budgets').delete().eq('id', id)
  if (error) throw new DataError(mapDbError(error, 'Não foi possível remover a meta.'))
}
