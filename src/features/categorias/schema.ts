import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(40, 'Use no máximo 40 caracteres.'),
  kind: z.enum(['expense', 'income']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Escolha uma cor.'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
