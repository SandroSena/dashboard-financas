import { isIsoDate } from '@/domain/month'
import { parseBrlInput } from '@/domain/money'
import { z } from 'zod'

export const transactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Informem onde o dinheiro foi.')
    .max(120, 'Usem no máximo 120 caracteres.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Informem o valor.')
    .refine((value) => parseBrlInput(value) != null, 'Informem um valor maior que zero, com até duas casas.'),
  kind: z.enum(['expense', 'income']),
  categoryId: z.string().min(1, 'Escolham uma categoria.'),
  occurredOn: z.string().refine(isIsoDate, 'Informem uma data válida.'),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
