import { DataError, getSupabase } from '@/shared/lib/supabase'

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (!error) return

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
    const message = error.message.toLowerCase()
    if (message.includes('already') || message.includes('registered')) {
      throw new DataError('Já existe uma conta com esse e-mail.')
    }
    throw new DataError('Não foi possível criar a conta.')
  }

  return data.session ? 'signed-in' : 'confirm-email'
}

export async function endSession(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw new DataError('Não foi possível sair.')
}
