import { isIsoDate } from '@/domain/month'
import { parseBrlInput } from '@/domain/money'
import { z } from 'zod'

export const transactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Informe onde o dinheiro foi.')
    .max(120, 'Use no máximo 120 caracteres.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Informe o valor.')
    .refine((value) => parseBrlInput(value) != null, 'Informe um valor maior que zero, com até duas casas.'),
  kind: z.enum(['expense', 'income']),
  categoryId: z.string().min(1, 'Escolha uma categoria.'),
  occurredOn: z.string().refine(isIsoDate, 'Informe uma data válida.'),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
