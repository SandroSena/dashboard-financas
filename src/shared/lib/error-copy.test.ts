import { errorReason, loadErrorText } from '@/shared/lib/error-copy'
import { describe, expect, it } from 'vitest'

const HINT = 'Confiram a conexão e tentem de novo.'

describe('loadErrorText: erro de carga sem orientar duas vezes (UX-44)', () => {
  it('mensagem de rede que já orienta não ganha o sufixo', () => {
    const network = 'Não foi possível conectar. Confiram a internet e tentem de novo.'
    expect(loadErrorText(network, HINT)).toBe(network)
    expect(loadErrorText('Não foi possível conectar. Verifique sua internet e tente de novo.', HINT)).toBe(
      'Não foi possível conectar. Verifique sua internet e tente de novo.',
    )
  })

  it('código que já orienta (rede, sessão) dispensa o sufixo', () => {
    expect(loadErrorText('Sem conexão.', HINT, 'network')).toBe('Sem conexão.')
  })

  it('mensagem que só diz o que houve ganha a orientação', () => {
    expect(loadErrorText('Não foi possível carregar os lançamentos.', HINT)).toBe(
      `Não foi possível carregar os lançamentos. ${HINT}`,
    )
  })

  it('sem mensagem, fica só a orientação', () => {
    expect(loadErrorText('  ', HINT)).toBe(HINT)
  })
})

describe('errorReason: motivo do toast de erro de uma ação', () => {
  it('mostra o motivo quando ele acrescenta algo', () => {
    expect(errorReason('Não foi possível excluir o lançamento.', 'Sua sessão expirou. Entrem novamente.')).toBe(
      'Sua sessão expirou. Entrem novamente.',
    )
  })

  it('omite o motivo igual ao título (texto genérico do repository)', () => {
    expect(errorReason('Não foi possível excluir o lançamento.', 'Não foi possível excluir o lançamento.')).toBeUndefined()
    expect(errorReason('Não foi possível salvar a meta.', ' não foi possível salvar a meta ')).toBeUndefined()
    expect(errorReason('Não foi possível salvar a meta.', '')).toBeUndefined()
  })
})
