/*
  Mensagens de erro de entrar/criar conta (docs/design/telas/login-cadastro.md, seção 5).
  `session.ts` já traduz o Supabase para português; aqui viram os textos da spec e um tipo,
  que diz à tela o que fazer (limpar a senha, oferecer "Entrar com esse e-mail").
*/

import { errorCode, errorMessage } from '@/shared/lib/supabase'

export type AuthErrorKind = 'credentials' | 'exists' | 'unconfirmed' | 'network' | 'other'

export type AuthErrorView = { kind: AuthErrorKind; text: string }

export const NETWORK_TEXT = 'Sem conexão com o servidor. Confiram a internet e tentem de novo.'

/**
  @param error o erro lançado por `session.ts`. A falta de conexão é reconhecida pelo
    `code: 'network'` do `DataError`; os outros casos, pela mensagem já traduzida.
*/
export function describeAuthError(error: unknown): AuthErrorView {
  if (errorCode(error) === 'network') return { kind: 'network', text: NETWORK_TEXT }
  const message = errorMessage(error)
  switch (message) {
    case 'E-mail ou senha incorretos.':
      return { kind: 'credentials', text: 'E-mail ou senha não conferem. Confiram e tentem de novo.' }
    case 'Já existe uma conta com esse e-mail.':
      return { kind: 'exists', text: 'Esse e-mail já tem conta.' }
    case 'Confirme o e-mail antes de entrar.':
      return { kind: 'unconfirmed', text: 'Falta confirmar o e-mail. Abram o link que mandamos e entrem de novo.' }
    default:
      return { kind: 'other', text: message }
  }
}

/**
  Destino depois de entrar (UX-94): volta para o link protegido que a pessoa abriu
  (`/painel?mes=2026-09`), mas só caminhos internos do app. Qualquer outra coisa
  (`//site.com`, `https://...`, `/entrar`) vai para `/painel`.
*/
export function redirectTarget(state: unknown, fallback = '/painel'): string {
  const from = (state as { from?: unknown } | null)?.from
  const path =
    typeof from === 'string'
      ? from
      : from && typeof from === 'object'
        ? `${String((from as { pathname?: unknown }).pathname ?? '')}${String((from as { search?: unknown }).search ?? '')}`
        : ''
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback
  if (/^\/(entrar|criar-conta)(\/|\?|$)/.test(path)) return fallback
  return path
}

/** E-mail passado de "Entrar com esse e-mail" (cadastro → login), se for texto curto. */
export function emailFromState(state: unknown): string {
  const email = (state as { email?: unknown } | null)?.email
  return typeof email === 'string' && email.length <= 254 ? email : ''
}
