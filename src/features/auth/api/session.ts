import { DataError, getSupabase, isNetworkFailure, NETWORK_ERROR_MESSAGE } from '@/shared/lib/supabase'

/** Sem resposta do servidor: o mesmo `DataError` de rede do `mapDbError` (`code: 'network'`). */
function networkError(error: { name?: string; message?: string; status?: number }): DataError | null {
  return isNetworkFailure(error) ? new DataError(NETWORK_ERROR_MESSAGE, 'network') : null
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (!error) return

  const offline = networkError(error)
  if (offline) throw offline

  const message = error.message.toLowerCase()
  if (message.includes('confirm')) {
    throw new DataError('Confirme o e-mail antes de entrar.')
  }
  if (message.includes('invalid') || message.includes('credential')) {
    throw new DataError('E-mail ou senha incorretos.')
  }
  throw new DataError('Não foi possível entrar.')
}

export async function createAccount(email: string, password: string): Promise<'signed-in' | 'confirm-email'> {
  const { data, error } = await getSupabase().auth.signUp({ email, password })
  if (error) {
    const offline = networkError(error)
    if (offline) throw offline

    const message = error.message.toLowerCase()
    if (message.includes('already') || message.includes('registered')) {
      throw new DataError('Já existe uma conta com esse e-mail.', 'unique_violation')
    }
    throw new DataError('Não foi possível criar a conta.')
  }

  return data.session ? 'signed-in' : 'confirm-email'
}

export async function endSession(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()
  if (error) {
    throw networkError(error) ?? new DataError('Não foi possível sair.')
  }
}
