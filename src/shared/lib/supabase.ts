import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function readEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function isSupabaseConfigured(): boolean {
  const url = readEnv('VITE_SUPABASE_URL')
  const key = readEnv('VITE_SUPABASE_ANON_KEY')
  if (!url || !key) return false
  if (url.includes('sua-url') || key.includes('sua-chave')) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado')
  }

  if (!client) {
    client = createClient(readEnv('VITE_SUPABASE_URL'), readEnv('VITE_SUPABASE_ANON_KEY'), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return client
}

export async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) {
    throw new DataError('Sua sessão expirou. Entre novamente.')
  }
  return data.user.id
}

export class DataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataError'
  }
}

type DbError = {
  code?: string
  message?: string
}

export function errorMessage(error: unknown): string {
  if (error instanceof DataError) return error.message
  return 'Algo deu errado. Tente novamente.'
}

export function mapDbError(error: DbError, fallback: string): string {
  const message = error.message?.trim() ?? ''
  const normalized = message.toLowerCase()

  if (error.code === '23505') return 'Já existe um registro com esses dados.'
  if (error.code === '23503') return 'Este item está em uso e não pode ser excluído.'
  if (error.code === 'PGRST116') return 'Registro não encontrado.'
  if (error.code === 'PGRST301' || normalized.includes('jwt')) {
    return 'Sua sessão expirou. Entre novamente.'
  }
  if (message.includes('Orçamento só vale')) return 'Orçamento só vale para categorias de gasto.'
  if (message.includes('tipo do lançamento')) return 'O tipo do lançamento precisa ser o mesmo da categoria.'
  if (message.includes('Categoria inválida')) return 'Escolha uma categoria válida.'
  if (message.includes('tipo da categoria')) return 'O tipo da categoria não pode ser alterado.'
  if (message.includes('transferir o registro')) return 'Não é permitido alterar o dono deste lançamento.'
  if (normalized === 'failed to fetch' || normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return 'O navegador bloqueou a alteração. Desative extensões de CORS, como Allow CORS, e tente de novo.'
  }
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) {
    return 'Você não tem permissão para alterar este lançamento.'
  }
  if (normalized.includes('invalid input syntax for type date')) return 'Informe uma data válida.'
  if (normalized.includes('invalid input syntax for type numeric')) return 'Informe um valor válido.'
  if (normalized.includes('check constraint') || normalized.includes('verificação')) {
    return 'Algum dado do lançamento não foi aceito. Confira valor, data e descrição.'
  }
  if (message) return message
  return fallback
}
