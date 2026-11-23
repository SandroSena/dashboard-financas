import { createAccount, endSession, signInWithPassword } from '@/features/auth/api/session'
import { DataError, NETWORK_ERROR_MESSAGE } from '@/shared/lib/supabase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/lib/supabase')>()
  return { ...original, getSupabase: () => ({ auth }) }
})

/** Forma do `AuthRetryableFetchError` do auth-js quando o `fetch` rejeita. */
function fetchFailure(message = 'Failed to fetch', status = 0) {
  return { name: 'AuthRetryableFetchError', message, status }
}

async function caught(promise: Promise<unknown>): Promise<DataError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(DataError)
  return error as DataError
}

describe('session: falha de rede', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('entrar sem rede devolve code "network" e a mensagem de conexão', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: fetchFailure() })
    const error = await caught(signInWithPassword('pessoa@exemplo.test', 'senha-de-teste'))
    expect(error.code).toBe('network')
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE)
  })

  it.each(['TypeError: Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'])(
    'reconhece "%s" mesmo sem o nome do erro do auth-js',
    async (message) => {
      auth.signInWithPassword.mockResolvedValue({ error: { name: 'AuthUnknownError', message, status: undefined } })
      expect((await caught(signInWithPassword('pessoa@exemplo.test', 'x'))).code).toBe('network')
    },
  )

  it('5xx do servidor (AuthRetryableFetchError com status 503) não conta como rede', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: fetchFailure('Service Unavailable', 503) })
    const error = await caught(signInWithPassword('pessoa@exemplo.test', 'x'))
    expect(error.code).toBeUndefined()
    expect(error.message).toBe('Não foi possível entrar.')
  })

  it('criar conta e sair sem rede também devolvem code "network"', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: fetchFailure() })
    auth.signOut.mockResolvedValue({ error: fetchFailure() })
    expect((await caught(createAccount('pessoa@exemplo.test', 'x'))).code).toBe('network')
    expect((await caught(endSession())).code).toBe('network')
  })
})

describe('session: erros do Supabase Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('credenciais erradas e e-mail não confirmado continuam com as mensagens de antes', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 },
    })
    auth.signInWithPassword.mockResolvedValueOnce({
      error: { name: 'AuthApiError', message: 'Email not confirmed', status: 400 },
    })
    expect((await caught(signInWithPassword('pessoa@exemplo.test', 'x'))).message).toBe('E-mail ou senha incorretos.')
    expect((await caught(signInWithPassword('pessoa@exemplo.test', 'x'))).message).toBe(
      'Confirme o e-mail antes de entrar.',
    )
  })

  it('conta já existente devolve code "unique_violation"', async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null },
      error: { name: 'AuthApiError', message: 'User already registered', status: 422 },
    })
    const error = await caught(createAccount('pessoa@exemplo.test', 'x'))
    expect(error.code).toBe('unique_violation')
    expect(error.message).toBe('Já existe uma conta com esse e-mail.')
  })
})
