import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchAllPages, PageFetchError, type FetchPage } from '@/shared/lib/paginate'

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
    if (error && isNetworkFailure(error)) throw new DataError(NETWORK_ERROR_MESSAGE, 'network')
    throw new DataError(SESSION_EXPIRED_MESSAGE, 'auth')
  }
  return data.user.id
}

/**
 * Código estável do `DataError`, para a tela decidir o que fazer sem comparar o
 * texto da mensagem (que pode mudar). É semântico, e não o código cru do
 * Postgres/PostgREST, para a tela não depender do banco nem espalhar `'23505'`:
 *
 * - `unique_violation`: Postgres 23505 (registro repetido)
 * - `fk_violation`: Postgres 23503 (item em uso por outro registro)
 * - `check_violation`: Postgres 23514 (check constraint)
 * - `invalid_input`: sintaxe inválida de data ou número
 * - `business_rule`: exceção dos triggers (`raise exception`, P0001) já traduzida
 * - `not_found`: PostgREST PGRST116 (nenhuma linha no `.single()`)
 * - `auth`: sessão ausente ou expirada (PGRST301/PGRST303, JWT, `getUser` sem usuário)
 * - `permission`: Postgres 42501, RLS, "permission denied"
 * - `network`: o servidor não respondeu (fetch falhou; `AuthRetryableFetchError` com status 0)
 *
 * `undefined` = erro não reconhecido (a mensagem é o fallback da operação).
 */
export type DataErrorCode =
  | 'unique_violation'
  | 'fk_violation'
  | 'check_violation'
  | 'invalid_input'
  | 'business_rule'
  | 'not_found'
  | 'auth'
  | 'permission'
  | 'network'

export class DataError extends Error {
  readonly code?: DataErrorCode

  constructor(message: string, code?: DataErrorCode) {
    super(message)
    this.name = 'DataError'
    this.code = code
  }
}

export type DbError = {
  code?: string
  message?: string
}

export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tentem de novo.'
export const NETWORK_ERROR_MESSAGE = 'Sem conexão. Confiram a internet e tentem de novo.'
export const PERMISSION_ERROR_MESSAGE = 'Vocês não têm permissão para fazer esta alteração.'
export const SESSION_EXPIRED_MESSAGE = 'A sessão expirou. Entrem de novo.'

export function errorMessage(error: unknown): string {
  if (error instanceof DataError) return error.message
  return GENERIC_ERROR_MESSAGE
}

/** Código do `DataError`, ou `undefined` para qualquer outro erro. */
export function errorCode(error: unknown): DataErrorCode | undefined {
  return error instanceof DataError ? error.code : undefined
}

function isNetworkMessage(normalized: string): boolean {
  return (
    normalized.includes('failed to fetch') || // Chrome, Edge
    normalized.includes('networkerror') || // Firefox
    normalized.includes('load failed') || // Safari
    normalized.includes('network request failed')
  )
}

/**
 * Falha de rede vinda do supabase-js: o `fetch` rejeitou (mensagem do navegador)
 * ou o auth-js embrulhou isso num `AuthRetryableFetchError` com status 0.
 * `AuthRetryableFetchError` com status 5xx não conta: o servidor respondeu.
 */
export function isNetworkFailure(error: { name?: string; message?: string; status?: number }): boolean {
  if (error.name === 'AuthRetryableFetchError' && error.status === 0) return true
  return isNetworkMessage((error.message ?? '').toLowerCase())
}

type Classified = { code?: DataErrorCode; message?: string }

/** Tabela única de tradução: a mensagem e o código saem sempre juntos. */
function classifyDbError(error: DbError): Classified {
  const message = error.message?.trim() ?? ''
  const normalized = message.toLowerCase()

  if (error.code === '23505') return { code: 'unique_violation', message: 'Já existe um registro com esses dados.' }
  if (error.code === '23503') return { code: 'fk_violation', message: 'Este item está em uso e não pode ser excluído.' }
  if (error.code === 'PGRST116') return { code: 'not_found', message: 'Registro não encontrado.' }
  if (error.code === 'PGRST301' || error.code === 'PGRST303' || normalized.includes('jwt')) {
    return { code: 'auth', message: SESSION_EXPIRED_MESSAGE }
  }
  if (message.includes('Orçamento só vale')) {
    return { code: 'business_rule', message: 'Orçamento só vale para categorias de gasto.' }
  }
  if (message.includes('tipo do lançamento')) {
    return { code: 'business_rule', message: 'O tipo do lançamento precisa ser o mesmo da categoria.' }
  }
  if (message.includes('Categoria inválida')) return { code: 'business_rule', message: 'Escolham uma categoria válida.' }
  if (message.includes('tipo da categoria')) {
    return { code: 'business_rule', message: 'O tipo da categoria não pode ser alterado.' }
  }
  if (message.includes('transferir o registro')) {
    return { code: 'business_rule', message: 'Não é permitido alterar o dono deste registro.' }
  }
  if (isNetworkMessage(normalized)) return { code: 'network', message: NETWORK_ERROR_MESSAGE }
  if (
    error.code === '42501' ||
    normalized.includes('row-level security') ||
    normalized.includes('permission denied')
  ) {
    return { code: 'permission', message: PERMISSION_ERROR_MESSAGE }
  }
  if (normalized.includes('invalid input syntax for type date')) {
    return { code: 'invalid_input', message: 'Informem uma data válida.' }
  }
  if (normalized.includes('invalid input syntax for type numeric')) {
    return { code: 'invalid_input', message: 'Informem um valor válido.' }
  }
  if (error.code === '23514' || normalized.includes('check constraint') || normalized.includes('verificação')) {
    return { code: 'check_violation', message: 'Algum dado não foi aceito. Confiram os campos e tentem de novo.' }
  }
  return {}
}

/**
 * Traduz um erro do Supabase num `DataError` com mensagem em português segura
 * para o usuário e o `code` semântico. Nunca devolve o texto cru do banco (SQL,
 * nome de constraint, tabela): o que não for reconhecido vira o `fallback`, sem
 * código. O erro original só vai para o console em desenvolvimento.
 * Use nos repositories: `throw toDataError(error, 'Não foi possível ...')`.
 */
export function toDataError(error: DbError, fallback: string): DataError {
  if (import.meta.env.DEV) console.error('[supabase]', error)
  const classified = classifyDbError(error)
  return new DataError(classified.message ?? fallback, classified.code)
}

/** Só a mensagem de `toDataError`. */
export function mapDbError(error: DbError, fallback: string): string {
  return toDataError(error, fallback).message
}

/**
 * Lista todas as linhas de uma consulta, página por página (ver `paginate.ts`).
 * Se uma página falhar, rejeita com `DataError` e não devolve nada parcial.
 */
export async function listAllPages<Row>(fetchPage: FetchPage<Row>, fallback: string): Promise<Row[]> {
  try {
    return await fetchAllPages(fetchPage)
  } catch (error) {
    if (error instanceof PageFetchError) throw toDataError(error.dbError, fallback)
    throw new DataError(fallback)
  }
}
