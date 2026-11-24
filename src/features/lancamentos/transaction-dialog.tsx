import { monthName } from '@/domain/month'
import { formatAmountInput, parseBrlInput } from '@/domain/money'
import type { Category, Kind, Transaction } from '@/domain/types'
import { CategoryChips } from '@/features/lancamentos/category-chips'
import { otherMonthOf } from '@/features/lancamentos/filters'
import { MAX_CATEGORY_CHIPS, newTransactionDefaults, shortcutDate } from '@/features/lancamentos/form-defaults'
import { useCreateTransaction, useUpdateTransaction } from '@/features/lancamentos/hooks'
import { transactionSchema, type TransactionFormValues } from '@/features/lancamentos/schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { toastActionError } from '@/shared/lib/toast-error'
import { Button } from '@/shared/ui/button'
import { AppDialog, DialogActions } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { MoneyInput, TextInput } from '@/shared/ui/input'
import { NativeSelect } from '@/shared/ui/select'
import { Segmented } from '@/shared/ui/segmented'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Trash } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

/** Última categoria usada em cada tipo, nesta sessão (UX-55). Não vai para storage. */
const lastUsedCategory: Partial<Record<Kind, string>> = {}

/**
  Novo lançamento e edição (docs/design/telas/lancamentos.md, seção 4).
  Ordem: Tipo → Valor (foco inicial) → Onde foi → Categoria → Data.

  @param defaultDate data inicial (AAAA-MM-DD) para um lançamento novo, ex.: o dia
    escolhido na régua do painel. Inválida ou ausente → hoje, se for o mês aberto, ou dia 1.
  @param defaultKind / defaultCategoryId pré-preenchimentos do painel. A categoria define o tipo.
  @param onSaved chamado depois de salvar (a tela destaca a linha).
  @param onDelete em edição, mostra "Excluir lançamento" no rodapé; o diálogo fecha e a
    tela confirma.
*/
export function TransactionDialog({
  open,
  onOpenChange,
  month,
  categories,
  transaction,
  defaultDate,
  defaultKind,
  defaultCategoryId,
  onSaved,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  categories: Category[]
  transaction?: Transaction | null
  defaultDate?: string
  defaultKind?: Kind
  defaultCategoryId?: string
  onSaved?: (transaction: Transaction, mode: 'created' | 'updated') => void
  onDelete?: (transaction: Transaction) => void
}) {
  const create = useCreateTransaction(month)
  const update = useUpdateTransaction(month)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [initial] = useState<TransactionFormValues>(() => {
    if (transaction) {
      return {
        description: transaction.description,
        amount: formatAmountInput(transaction.amount),
        kind: transaction.kind,
        categoryId: transaction.categoryId,
        occurredOn: transaction.occurredOn,
      }
    }
    const recent = queryClient.getQueryData<Transaction[]>(queryKeys.transactions(month)) ?? []
    const defaults = newTransactionDefaults(
      month,
      categories,
      { kind: defaultKind, categoryId: defaultCategoryId, occurredOn: defaultDate },
      { lastUsed: lastUsedCategory, recent },
    )
    return { description: '', amount: '', ...defaults }
  })

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initial,
    reValidateMode: 'onBlur',
  })

  const kind = form.watch('kind')
  const options = categories.filter((category) => category.kind === kind)
  const pending = create.isPending || update.isPending
  const errors = form.formState.errors
  const useChips = options.length > 0 && options.length <= MAX_CATEGORY_CHIPS

  function selectKind(next: Kind) {
    form.setValue('kind', next)
    const current = form.getValues('categoryId')
    const stillValid = categories.some((category) => category.id === current && category.kind === next)
    if (stillValid) return
    const fallback = transaction
      ? ''
      : newTransactionDefaults(month, categories, { kind: next }, { lastUsed: lastUsedCategory, recent: [] }).categoryId
    form.setValue('categoryId', fallback, { shouldValidate: form.formState.isSubmitted })
  }

  async function onSubmit(values: TransactionFormValues) {
    const amount = parseBrlInput(values.amount)
    if (amount == null || pending) return
    const input = {
      description: values.description,
      amount,
      kind: values.kind,
      categoryId: values.categoryId,
      occurredOn: values.occurredOn,
    }

    try {
      const saved = transaction
        ? await update.mutateAsync({ id: transaction.id, input })
        : await create.mutateAsync(input)
      lastUsedCategory[saved.kind] = saved.categoryId
      const target = otherMonthOf(saved.occurredOn, month)
      const verb = transaction ? 'atualizado' : 'adicionado'
      if (target) {
        const name = monthName(target)
        toast.success(`Lançamento ${verb} em ${name}.`, {
          action: { label: `Ver ${name}`, onClick: () => navigate(`/lancamentos?mes=${target}`) },
        })
      } else {
        toast.success(`Lançamento ${verb}.`)
      }
      onSaved?.(saved, transaction ? 'updated' : 'created')
      onOpenChange(false)
    } catch (error) {
      // O diálogo continua aberto com o que foi digitado.
      toastActionError(transaction ? 'Não foi possível salvar o lançamento.' : 'Não foi possível adicionar o lançamento.', error)
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending || next) onOpenChange(next)
      }}
      title={transaction ? 'Editar lançamento' : 'Novo lançamento'}
      description="Onde o dinheiro foi, quanto e quando."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={pending} className="grid min-w-0 gap-4">
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

          <Field label="Valor" htmlFor="tx-amount" error={errors.amount?.message}>
            {/* Foco inicial aqui (UX-55): o Radix não move o foco se ele já está dentro do diálogo. */}
            <MoneyInput id="tx-amount" size="lg" placeholder="0,00" autoFocus enterKeyHint="next" {...form.register('amount')} />
          </Field>

          <Field label="Onde foi" htmlFor="tx-description" error={errors.description?.message}>
            <TextInput
              id="tx-description"
              placeholder="Ex.: Mercado, aluguel, salário"
              autoComplete="off"
              enterKeyHint="next"
              {...form.register('description')}
            />
          </Field>

          {options.length === 0 ? (
            <div className="grid gap-1.5">
              <p className="text-body-sm font-medium">Categoria</p>
              <p className="text-body-sm text-muted-foreground">
                Nenhuma categoria de {kind === 'expense' ? 'gasto' : 'receita'}. Criem uma em{' '}
                <Link
                  to="/categorias"
                  className="rounded-chip font-semibold text-brand underline-offset-4 hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  Categorias
                </Link>
                .
              </p>
            </div>
          ) : useChips ? (
            <div className="grid gap-1.5">
              <p id="tx-category-label" className="text-body-sm font-medium">
                Categoria
              </p>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <CategoryChips
                    categories={options}
                    value={field.value}
                    onChange={(id) => {
                      field.onChange(id)
                      field.onBlur()
                    }}
                    labelledBy="tx-category-label"
                    describedBy={errors.categoryId ? 'tx-category-erro' : undefined}
                    invalid={Boolean(errors.categoryId)}
                    focusRef={field.ref}
                  />
                )}
              />
              {errors.categoryId ? (
                <p id="tx-category-erro" className="flex items-start gap-1.5 text-body-sm text-expense" role="alert">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {errors.categoryId.message}
                </p>
              ) : null}
            </div>
          ) : (
            <Field label="Categoria" htmlFor="tx-category" error={errors.categoryId?.message}>
              <NativeSelect id="tx-category" {...form.register('categoryId')}>
                <option value="">Escolham a categoria</option>
                {options.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          <Field label="Data" htmlFor="tx-date" error={errors.occurredOn?.message}>
            <div className="flex items-center gap-2">
              <TextInput id="tx-date" type="date" className="min-w-0 flex-1" enterKeyHint="done" {...form.register('occurredOn')} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => form.setValue('occurredOn', shortcutDate('today'), { shouldValidate: true })}
              >
                Hoje
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => form.setValue('occurredOn', shortcutDate('yesterday'), { shouldValidate: true })}
              >
                Ontem
              </Button>
            </div>
          </Field>

          <DialogActions className="sm:items-center">
            {transaction && onDelete ? (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={() => {
                  onOpenChange(false)
                  onDelete(transaction)
                }}
              >
                <Trash aria-hidden="true" />
                Excluir lançamento
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={options.length === 0}>
              {pending ? 'Salvando...' : transaction ? 'Salvar alterações' : 'Adicionar lançamento'}
            </Button>
          </DialogActions>
        </fieldset>
      </form>
    </AppDialog>
  )
}
