import type { Category, Kind } from '@/domain/types'
import { CATEGORY_COLORS } from '@/features/categorias/colors'
import { useCreateCategory, useUpdateCategory } from '@/features/categorias/hooks'
import { categorySchema, type CategoryFormValues } from '@/features/categorias/schema'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { AppDialog, Field, TextInput } from '@/shared/ui/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultKind,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  defaultKind: Kind
}) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { name: category.name, kind: category.kind, color: category.color }
      : { name: '', kind: defaultKind, color: CATEGORY_COLORS[0] },
  })
  const color = form.watch('color')
  const kind = form.watch('kind')
  const pending = create.isPending || update.isPending

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, input: { name: values.name, color: values.color } })
        toast.success('Categoria atualizada.')
      } else {
        await create.mutateAsync(values)
        toast.success('Categoria criada.')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Editar categoria' : 'Nova categoria'}
      description={category ? 'O tipo permanece o mesmo dos lançamentos já feitos.' : 'Escolha o tipo, o nome e uma cor.'}
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {category ? null : (
          <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={kind === 'expense'}
              className={cn(
                'h-10 rounded-lg border text-sm font-medium',
                kind === 'expense' ? 'border-foreground bg-foreground text-background' : 'border-input',
              )}
              onClick={() => form.setValue('kind', 'expense')}
            >
              Gasto
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={kind === 'income'}
              className={cn(
                'h-10 rounded-lg border text-sm font-medium',
                kind === 'income' ? 'border-foreground bg-foreground text-background' : 'border-input',
              )}
              onClick={() => form.setValue('kind', 'income')}
            >
              Receita
            </button>
          </div>
        )}
        <Field label="Nome" htmlFor="category-name" error={form.formState.errors.name?.message}>
          <TextInput id="category-name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`Cor ${item}`}
                aria-pressed={color === item}
                className={cn(
                  'size-8 rounded-full border-2',
                  color === item ? 'border-foreground' : 'border-transparent',
                )}
                style={{ backgroundColor: item }}
                onClick={() => form.setValue('color', item, { shouldValidate: true })}
              />
            ))}
          </div>
          {form.formState.errors.color ? (
            <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
          ) : null}
        </fieldset>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}
