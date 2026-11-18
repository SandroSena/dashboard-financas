import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .refine((value) => z.email().safeParse(value).success, 'Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
})

export type Credentials = z.infer<typeof credentialsSchema>
