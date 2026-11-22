import { defaultDateForMonth } from '@/domain/month'
import { formatAmountInput, parseBrlInput } from '@/domain/money'
import type { Category, Kind, Transaction } from '@/domain/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { transactionSchema, type TransactionFormValues } from '@/features/lancamentos/schema'
import { useCreateTransaction, useUpdateTransaction } from '@/features/lancamentos/hooks'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { AppDialog, DialogActions, Field, NativeSelect, Segmented, TextInput } from '@/shared/ui/dialog'

export function TransactionDialog({
  open,
  onOpenChange,
  month,
  categories,
  transaction,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  categories: Category[]
  transaction?: Transaction | null
}) {
  const create = useCreateTransaction(month)
  const update = useUpdateTransaction(month)
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          amount: formatAmountInput(transaction.amount),
          kind: transaction.kind,
          categoryId: transaction.categoryId,
          occurredOn: transaction.occurredOn,
        }
      : {
          description: '',
          amount: '',
          kind: 'expense',
          categoryId: '',
          occurredOn: defaultDateForMonth(month),
        },
  })

  const kind = form.watch('kind')
  const options = categories.filter((category) => category.kind === kind)
  const pending = create.isPending || update.isPending

  function selectKind(next: Kind) {
    form.setValue('kind', next)
    const current = form.getValues('categoryId')
    const stillValid = categories.some((category) => category.id === current && category.kind === next)
    if (!stillValid) form.setValue('categoryId', '')
  }

  async function onSubmit(values: TransactionFormValues) {
    const amount = parseBrlInput(values.amount)
    if (amount == null) return
    const input = {
      description: values.description,
      amount,
      kind: values.kind,
      categoryId: values.categoryId,
      occurredOn: values.occurredOn,
    }

    try {
      if (transaction) {
        await update.mutateAsync({ id: transaction.id, input })
        toast.success('Lançamento atualizado.')
      } else {
        await create.mutateAsync(input)
        toast.success('Lançamento adicionado.')
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
      title={transaction ? 'Editar lançamento' : 'Novo lançamento'}
      description="Onde o dinheiro foi, quanto e quando."
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Segmented
          label="Tipo"
          className="w-full"
          value={kind}
          onChange={selectKind}
          options={[
            { value: 'expense', label: 'Gasto', tone: 'expense' },
            { value: 'income', label: 'Receita', tone: 'income' },
          ]}
        />
        <Field label="Onde foi" htmlFor="description" error={form.formState.errors.description?.message}>
          <TextInput
            id="description"
            placeholder="Ex.: Mercado, aluguel, salário"
            aria-invalid={Boolean(form.formState.errors.description)}
            {...form.register('description')}
          />
        </Field>
        <Field label="Valor" htmlFor="amount" error={form.formState.errors.amount?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-display text-lg text-muted-foreground">
              R$
            </span>
            <TextInput
              id="amount"
              inputMode="decimal"
              placeholder="0,00"
              className="numeral h-14 pl-12 text-2xl font-semibold"
              aria-invalid={Boolean(form.formState.errors.amount)}
              {...form.register('amount')}
            />
          </div>
        </Field>
        <Field label="Categoria" htmlFor="category" error={form.formState.errors.categoryId?.message}>
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria de {kind === 'expense' ? 'gasto' : 'receita'}. Crie uma em Categorias.
            </p>
          ) : (
            <NativeSelect
              id="category"
              aria-invalid={Boolean(form.formState.errors.categoryId)}
              {...form.register('categoryId')}
            >
              <option value="">Selecione</option>
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field label="Data" htmlFor="occurred-on" error={form.formState.errors.occurredOn?.message}>
          <TextInput
            id="occurred-on"
            type="date"
            aria-invalid={Boolean(form.formState.errors.occurredOn)}
            {...form.register('occurredOn')}
          />
        </Field>
        <DialogActions>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || options.length === 0}>
            {pending ? 'Salvando...' : transaction ? 'Salvar alterações' : 'Adicionar lançamento'}
          </Button>
        </DialogActions>
      </form>
    </AppDialog>
  )
}
