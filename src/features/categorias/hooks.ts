import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryInput,
} from '@/features/categorias/api/categories-repository'
import { queryKeys } from '@/shared/lib/query-keys'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Pick<CategoryInput, 'name' | 'color'> }) =>
      updateCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}
