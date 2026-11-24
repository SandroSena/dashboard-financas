import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Informem o nome.').max(40, 'Usem no máximo 40 caracteres.'),
  kind: z.enum(['expense', 'income']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Escolham uma cor.'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
