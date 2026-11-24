import type { Category, Kind } from '@/domain/types'
import { CATEGORY_SLOTS, categorySlot, isPaletteColor } from '@/features/categorias/colors'
import { useCreateCategory, useUpdateCategory } from '@/features/categorias/hooks'
import { DUPLICATE_NAME_TEXT, isDuplicateNameError, NAME_MAX_LENGTH, nameCounter } from '@/features/categorias/model'
import { categorySchema, type CategoryFormValues } from '@/features/categorias/schema'
import { CategoryAvatar } from '@/shared/components/category-avatar'
import { toastActionError } from '@/shared/lib/toast-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { AppDialog, DialogActions } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { TextInput } from '@/shared/ui/input'
import { Progress } from '@/shared/ui/progress'
import { Segmented } from '@/shared/ui/segmented'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Info, Trash } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

/**
  Nova categoria e edição (docs/design/telas/categorias.md, seção 4): tipo (só na criação),
  nome com contador, 8 cores da paleta e prévia ao vivo. Categoria antiga com cor fora da
  paleta (ex.: verde, vermelho, âmbar) abre no slot mapeado, com aviso (UX-74).

  @param onSaved chamado com a categoria salva (a tela destaca o card).
  @param onDelete em edição, mostra "Excluir categoria" no rodapé (celular, UX-78).
*/
export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultKind,
  onSaved,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  defaultKind: Kind
  onSaved?: (category: Category) => void
  onDelete?: (category: Category) => void
}) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const colorAdjusted = Boolean(category && !isPaletteColor(category.color))
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { name: category.name, kind: category.kind, color: categorySlot(category.color).hex }
      : { name: '', kind: defaultKind, color: CATEGORY_SLOTS[0].hex },
    reValidateMode: 'onBlur',
  })
  const [color, kind, name] = useWatch({ control: form.control, name: ['color', 'kind', 'name'] })
  const selectedSlot = categorySlot(color)
  const pending = create.isPending || update.isPending
  const counter = nameCounter(name.length)

  async function onSubmit(values: CategoryFormValues) {
    if (pending) return
    try {
      const saved = category
        ? await update.mutateAsync({ id: category.id, input: { name: values.name, color: values.color } })
        : await create.mutateAsync(values)
      toast.success(category ? 'Categoria atualizada.' : 'Categoria criada.')
      onSaved?.(saved)
      onOpenChange(false)
    } catch (error) {
      if (isDuplicateNameError(error)) {
        // UX-76: o erro fica embaixo do campo, com foco nele.
        form.setError('name', { type: 'server', message: DUPLICATE_NAME_TEXT }, { shouldFocus: true })
        return
      }
      toastActionError(category ? 'Não foi possível salvar a categoria.' : 'Não foi possível criar a categoria.', error)
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending || next) onOpenChange(next)
      }}
      title={category ? 'Editar categoria' : 'Nova categoria'}
      description={
        category ? 'O tipo continua o mesmo, para não misturar o histórico.' : 'Escolham o tipo, o nome e uma cor.'
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={pending} className="grid min-w-0 gap-5">
          {category ? null : (
            <Segmented
              label="Tipo"
              className="w-full"
              value={kind}
              onChange={(next) => form.setValue('kind', next)}
              options={[
                { value: 'expense', label: 'Gasto', tone: 'expense' },
                { value: 'income', label: 'Receita', tone: 'income' },
              ]}
            />
          )}

          <Field
            label="Nome"
            htmlFor="category-name"
            error={form.formState.errors.name?.message}
            hint={counter ? <span className="figure">{counter} caracteres</span> : undefined}
          >
            <TextInput
              id="category-name"
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              placeholder={kind === 'expense' ? 'Ex.: Mercado' : 'Ex.: Salário'}
              {...form.register('name')}
            />
          </Field>

          <fieldset className="grid min-w-0 gap-2">
            <legend className="mb-2 text-body-sm font-medium">Cor</legend>
            {/* Rádios nativos: um só ponto de Tab e setas que movem e marcam (UX-72). */}
            <div className="grid w-fit grid-cols-4 gap-1 sm:grid-cols-8 sm:gap-0.5" role="radiogroup" aria-label="Cor">
              {CATEGORY_SLOTS.map((slot) => {
                const checked = selectedSlot.hex === slot.hex
                return (
                  <label key={slot.id} className="relative flex size-11 cursor-pointer items-center justify-center">
                    <input
                      type="radio"
                      name="category-color"
                      value={slot.hex}
                      checked={checked}
                      aria-label={slot.name}
                      className="peer sr-only"
                      onChange={() => form.setValue('color', slot.hex, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-card',
                        'transition-[box-shadow,transform] duration-(--duration-fast) ease-standard hover:scale-110',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                        checked && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover',
                      )}
                      style={{ backgroundColor: slot.cssVar }}
                      aria-hidden="true"
                    >
                      {checked ? <Check className="size-4" strokeWidth={3} /> : null}
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="text-body-sm text-muted-foreground" aria-live="polite">
              Cor: <span className="font-medium text-foreground">{selectedSlot.name}</span>
            </p>
            {colorAdjusted ? (
              <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                A cor foi ajustada para a paleta nova. Salvem para confirmar.
              </p>
            ) : null}
            {form.formState.errors.color ? (
              <p className="text-body-sm text-expense" role="alert">
                {form.formState.errors.color.message}
              </p>
            ) : null}
          </fieldset>

          <CategoryPreview name={name} color={color} kind={kind} />

          <DialogActions className="sm:items-center">
            {category && onDelete ? (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={() => {
                  onOpenChange(false)
                  onDelete(category)
                }}
              >
                <Trash aria-hidden="true" />
                Excluir categoria
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? 'Salvando...' : category ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </DialogActions>
        </fieldset>
      </form>
    </AppDialog>
  )
}

/**
  Prévia ao vivo nos dois contextos em que a cor aparece: a linha de lançamento (inicial
  no círculo) e uma barra de gráfico. Decorativa: o nome da cor já está escrito acima.
*/
function CategoryPreview({ name, color, kind }: { name: string; color: string; kind: Kind }) {
  const label = name.trim() || (kind === 'expense' ? 'Mercado' : 'Salário')
  const slot = categorySlot(color)
  return (
    <div className="grid gap-2" aria-hidden="true">
      <p className="text-body-sm font-medium">Prévia</p>
      <div className="grid gap-3 rounded-control bg-sunken p-3">
        <div className="flex items-center gap-3 rounded-control bg-card px-3 py-2 shadow-edge">
          <CategoryAvatar name={label} color={color} />
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-body-sm font-medium">{kind === 'expense' ? 'Compra da semana' : 'Pagamento do mês'}</span>
            <span className="truncate text-caption text-muted-foreground">{label}</span>
          </span>
          <span className={cn('figure shrink-0 text-body-sm font-semibold', kind === 'income' ? 'text-income' : 'text-foreground')}>
            {kind === 'income' ? '+ R$ 3.200,00' : '− R$ 186,40'}
          </span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="w-20 shrink-0 truncate text-caption text-muted-foreground">{label}</span>
          <Progress value={64} color={slot.cssVar} size="lg" className="flex-1" />
        </div>
      </div>
    </div>
  )
}
