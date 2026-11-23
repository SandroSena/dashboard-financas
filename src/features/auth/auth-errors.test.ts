import { describeAuthError, emailFromState, NETWORK_TEXT, redirectTarget } from '@/features/auth/auth-errors'
import { DataError, NETWORK_ERROR_MESSAGE } from '@/shared/lib/supabase'
import { describe, expect, it } from 'vitest'

describe('auth: mensagens de erro', () => {
  it('UX-92: credenciais erradas viram o texto da spec e o tipo "credentials" (limpa a senha)', () => {
    expect(describeAuthError(new DataError('E-mail ou senha incorretos.'))).toEqual({
      kind: 'credentials',
      text: 'E-mail ou senha não conferem. Confiram e tentem de novo.',
    })
  })

  it('e-mail já cadastrado oferece "Entrar com esse e-mail"; sem rede, o texto de conexão', () => {
    expect(describeAuthError(new DataError('Já existe uma conta com esse e-mail.', 'unique_violation')).kind).toBe('exists')
    expect(describeAuthError(new DataError(NETWORK_ERROR_MESSAGE, 'network'))).toEqual({ kind: 'network', text: NETWORK_TEXT })
    expect(describeAuthError(new DataError('Não foi possível entrar.'))).toEqual({ kind: 'other', text: 'Não foi possível entrar.' })
  })

  it('a falta de rede é reconhecida pelo code, não pelo texto da mensagem', () => {
    expect(describeAuthError(new DataError('qualquer texto', 'network')).kind).toBe('network')
    expect(describeAuthError(new DataError(NETWORK_ERROR_MESSAGE)).kind).toBe('other')
  })

  it('erro que não é DataError vira a mensagem genérica, sem detalhe interno', () => {
    expect(describeAuthError(new Error('TypeError: x is undefined'))).toEqual({
      kind: 'other',
      text: 'Algo deu errado. Tentem de novo.',
    })
  })
})

describe('auth: destino depois de entrar', () => {
  it('UX-94: volta para /painel?mes=2026-09 depois de entrar', () => {
    expect(redirectTarget({ from: '/painel?mes=2026-09' })).toBe('/painel?mes=2026-09')
    expect(redirectTarget({ from: { pathname: '/lancamentos', search: '?tipo=gastos' } })).toBe('/lancamentos?tipo=gastos')
  })

  it('destino externo, malformado ou de login cai no painel (sem redirecionamento aberto)', () => {
    for (const from of ['//evil.com', 'https://evil.com', '/\\evil.com', '/entrar', '/criar-conta?x=1', 42, null]) {
      expect(redirectTarget({ from })).toBe('/painel')
    }
    expect(redirectTarget(null)).toBe('/painel')
    expect(redirectTarget(undefined)).toBe('/painel')
  })

  it('e-mail passado do cadastro para o login', () => {
    expect(emailFromState({ email: 'ana@exemplo.com' })).toBe('ana@exemplo.com')
    expect(emailFromState({ email: 1 })).toBe('')
    expect(emailFromState(null)).toBe('')
  })
})
