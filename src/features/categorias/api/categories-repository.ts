import type { Category, Kind } from '@/domain/types'
import { DataError, getSupabase, listAllPages, requireUserId, toDataError } from '@/shared/lib/supabase'

type CategoryRow = {
  id: string
  name: string
  kind: Kind
  color: string
}

export type CategoryInput = {
  name: string
  kind: Kind
  color: string
}

const DUPLICATE_CATEGORY_MESSAGE = 'Já existe uma categoria com esse nome.'

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, kind: row.kind, color: row.color }
}

export async function listCategories(): Promise<Category[]> {
  const rows = await listAllPages<CategoryRow>(
    (from, to) =>
      getSupabase()
        .from('categories')
        .select('id, name, kind, color')
        .order('name', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to),
    'Não foi possível carregar as categorias.',
  )
  return rows.map(mapCategory)
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const userId = await requireUserId()
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ user_id: userId, name: input.name, kind: input.kind, color: input.color })
    .select('id, name, kind, color')
    .single()

  if (error) {
    throw error.code === '23505'
      ? new DataError(DUPLICATE_CATEGORY_MESSAGE, 'unique_violation')
      : toDataError(error, 'Não foi possível criar a categoria.')
  }

  return mapCategory(data as CategoryRow)
}

export async function updateCategory(id: string, input: Pick<CategoryInput, 'name' | 'color'>): Promise<Category> {
  const { data, error } = await getSupabase()
    .from('categories')
    .update({ name: input.name, color: input.color })
    .eq('id', id)
    .select('id, name, kind, color')
    .single()

  if (error) {
    throw error.code === '23505'
      ? new DataError(DUPLICATE_CATEGORY_MESSAGE, 'unique_violation')
      : toDataError(error, 'Não foi possível atualizar a categoria.')
  }

  return mapCategory(data as CategoryRow)
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from('categories').delete().eq('id', id)
  if (error) throw toDataError(error, 'Não foi possível excluir a categoria.')
}
