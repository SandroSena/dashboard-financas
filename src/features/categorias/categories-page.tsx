import type { Category, Kind } from '@/domain/types'
import { CategoryDialog } from '@/features/categorias/category-dialog'
import { useCategories, useDeleteCategory } from '@/features/categorias/hooks'
import { EmptyState, LoadingBlock, QueryError } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/page-header'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Pencil, Plus, Tags, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function CategoriesPage() {
  const categoriesQuery = useCategories()
  const remove = useDeleteCategory()
  const [kind, setKind] = useState<Kind>('expense')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [removing, setRemoving] = useState<Category | null>(null)
  const categories = (categoriesQuery.data ?? []).filter((category) => category.kind === kind)

  async function confirmRemove() {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      toast.success('Categoria excluída.')
      setRemoving(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Categorias"
        description="Como vocês separam o que entra e o que sai. O tipo de uma categoria não muda depois, para não misturar o histórico."
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Nova categoria
          </Button>
        }
      />

      <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
        <TabsList>
          <TabsTrigger value="expense">Gastos</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value={kind}>
          {categoriesQuery.isLoading ? (
            <LoadingBlock />
          ) : categoriesQuery.error ? (
            <QueryError message={errorMessage(categoriesQuery.error)} onRetry={() => void categoriesQuery.refetch()} />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tags className="size-5" />}
              title="Nenhuma categoria"
              description="Crie uma categoria para classificar os lançamentos."
            />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id} className="group flex items-center gap-3 rounded-xl bg-card py-2 pr-2 pl-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold"
                    style={{ backgroundColor: `${category.color}24`, color: category.color }}
                    aria-hidden="true"
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-medium">{category.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${category.name}`}
                    onClick={() => {
                      setEditing(category)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive"
                    aria-label={`Excluir ${category.name}`}
                    onClick={() => setRemoving(category)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {dialogOpen ? (
        <CategoryDialog
          key={editing?.id ?? `new-${kind}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editing}
          defaultKind={kind}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Excluir categoria?"
        description="Dá para excluir só se ela não tiver lançamentos. As metas dessa categoria também saem."
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
