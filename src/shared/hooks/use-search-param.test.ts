import { describe, expect, it } from 'vitest'
import { oneOf, readParam, uuidParam, withParam } from '@/shared/hooks/use-search-param'

const janela = oneOf(['3', '6', '12'] as const)

describe('use-search-param: validação', () => {
  it('AC-10: ?janela=12 é aceita', () => {
    expect(readParam(new URLSearchParams('janela=12'), 'janela', janela, '6')).toBe('12')
  })

  it('AC-10: ?janela=7, ?janela=abc ou vazia voltam para o padrão 6', () => {
    for (const query of ['janela=7', 'janela=abc', 'janela=', 'janela=%20', '']) {
      expect(readParam(new URLSearchParams(query), 'janela', janela, '6')).toBe('6')
    }
  })

  it('AC-15: ?categoria só aceita UUID; qualquer outra coisa vira null', () => {
    const id = '3F2504E0-4F89-11D3-9A0C-0305E82C3301'
    expect(readParam(new URLSearchParams(`categoria=${id}`), 'categoria', uuidParam, null)).toBe(id.toLowerCase())
    for (const raw of ["1' or '1'='1", '123', 'abc', '3f2504e0-4f89-11d3-9a0c-0305e82c330']) {
      const params = new URLSearchParams()
      params.set('categoria', raw)
      expect(readParam(params, 'categoria', uuidParam, null)).toBeNull()
    }
  })

  it('oneOf não aceita valores fora da lista nem parecidos', () => {
    const tipo = oneOf(['expense', 'income'] as const)
    expect(tipo('expense')).toBe('expense')
    expect(tipo('Expense')).toBeNull()
    expect(tipo('expenses')).toBeNull()
  })
})

describe('use-search-param: gravação', () => {
  it('AC-11: grava o parâmetro sem perder ?mes', () => {
    const next = withParam(new URLSearchParams('mes=2026-11'), 'comparar', 'media', 'anterior')
    expect(next.toString()).toBe('mes=2026-11&comparar=media')
  })

  it('AC-14: null remove o parâmetro (fechar a folha tira ?categoria)', () => {
    const next = withParam(new URLSearchParams('mes=2026-11&categoria=abc'), 'categoria', null, null)
    expect(next.toString()).toBe('mes=2026-11')
  })

  it('gravar o valor padrão remove o parâmetro, para o link ficar curto', () => {
    const next = withParam(new URLSearchParams('mes=2026-11&janela=12'), 'janela', '6', '6')
    expect(next.toString()).toBe('mes=2026-11')
  })

  it('não altera os parâmetros recebidos', () => {
    const current = new URLSearchParams('mes=2026-11')
    withParam(current, 'janela', '12', '6')
    expect(current.toString()).toBe('mes=2026-11')
  })
})
