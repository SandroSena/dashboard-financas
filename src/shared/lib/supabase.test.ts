import {
  DataError,
  errorCode,
  errorMessage,
  isNetworkFailure,
  mapDbError,
  NETWORK_ERROR_MESSAGE,
  PERMISSION_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  toDataError,
} from '@/shared/lib/supabase'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const FALLBACK = 'Não foi possível salvar.'

describe('mapDbError', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('nunca devolve a mensagem crua do banco: o que não é reconhecido vira o fallback', () => {
    const raw = 'column "secret_col" of relation "transactions" does not exist'
    const result = mapDbError({ code: '42703', message: raw }, FALLBACK)
    expect(result).toBe(FALLBACK)
    expect(result).not.toContain('transactions')
  })

  it('devolve o fallback quando não há mensagem', () => {
    expect(mapDbError({}, FALLBACK)).toBe(FALLBACK)
  })

  it('loga o erro original no console em desenvolvimento', () => {
    const error = { code: 'XX000', message: 'detalhe interno' }
    mapDbError(error, FALLBACK)
    expect(import.meta.env.DEV).toBe(true)
    expect(consoleError).toHaveBeenCalledWith('[supabase]', error)
  })

  it.each([
    ['23505', 'Já existe um registro com esses dados.'],
    ['23503', 'Este item está em uso e não pode ser excluído.'],
    ['PGRST116', 'Registro não encontrado.'],
    ['PGRST301', SESSION_EXPIRED_MESSAGE],
    ['PGRST303', SESSION_EXPIRED_MESSAGE],
  ])('traduz o código %s', (code, expected) => {
    expect(mapDbError({ code, message: 'texto técnico' }, FALLBACK)).toBe(expected)
  })

  it('AC-03: update sem linha (PGRST116) vira "Registro não encontrado."', () => {
    const error = {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
    }
    expect(mapDbError(error, FALLBACK)).toBe('Registro não encontrado.')
  })

  it('reconhece JWT expirado pela mensagem', () => {
    expect(mapDbError({ message: 'JWT expired' }, FALLBACK)).toBe(SESSION_EXPIRED_MESSAGE)
  })

  it.each([
    ['Orçamento só vale para categorias de gasto', 'Orçamento só vale para categorias de gasto.'],
    ['O tipo do lançamento precisa ser o mesmo da categoria', 'O tipo do lançamento precisa ser o mesmo da categoria.'],
    ['Categoria inválida', 'Escolham uma categoria válida.'],
    ['O tipo da categoria não pode ser alterado', 'O tipo da categoria não pode ser alterado.'],
    ['Não é permitido transferir o registro', 'Não é permitido alterar o dono deste registro.'],
  ])('traduz a mensagem do trigger "%s"', (message, expected) => {
    expect(mapDbError({ code: 'P0001', message }, FALLBACK)).toBe(expected)
  })

  it.each([
    'Failed to fetch',
    'TypeError: Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'Load failed',
    'TypeError: Load failed',
  ])('reconhece falha de rede "%s" com mensagem neutra, sem citar CORS', (message) => {
    const result = mapDbError({ message }, FALLBACK)
    expect(result).toBe(NETWORK_ERROR_MESSAGE)
    expect(result.toLowerCase()).not.toContain('cors')
    expect(result.toLowerCase()).not.toContain('extens')
  })

  it.each([
    { code: '42501', message: 'new row violates row-level security policy for table "budgets"' },
    { message: 'new row violates row-level security policy for table "categories"' },
    { message: 'permission denied for table transactions' },
  ])('mensagem de permissão é genérica, sem citar a tabela', (error) => {
    const result = mapDbError(error, FALLBACK)
    expect(result).toBe(PERMISSION_ERROR_MESSAGE)
    expect(result).not.toMatch(/lançamento|categoria|orçamento|budgets|categories|transactions/i)
  })

  it('traduz erros de sintaxe de data e número', () => {
    expect(mapDbError({ message: 'invalid input syntax for type date: "x"' }, FALLBACK)).toBe('Informem uma data válida.')
    expect(mapDbError({ message: 'invalid input syntax for type numeric: "x"' }, FALLBACK)).toBe(
      'Informem um valor válido.',
    )
  })

  it('check constraint vira mensagem genérica, sem o nome da constraint', () => {
    const result = mapDbError(
      {
        code: '23514',
        message: 'new row for relation "transactions" violates check constraint "transactions_amount_positive"',
      },
      FALLBACK,
    )
    expect(result).toBe('Algum dado não foi aceito. Confiram os campos e tentem de novo.')
    expect(result).not.toContain('transactions_amount_positive')
  })
})

describe('toDataError: code semântico', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [{ code: '23505', message: 'duplicate key' }, 'unique_violation'],
    [{ code: '23503', message: 'violates foreign key constraint' }, 'fk_violation'],
    [{ code: '23514', message: 'violates check constraint "x"' }, 'check_violation'],
    [{ code: '22007', message: 'invalid input syntax for type date: "x"' }, 'invalid_input'],
    [{ code: '22P02', message: 'invalid input syntax for type numeric: "x"' }, 'invalid_input'],
    [{ code: 'P0001', message: 'Categoria inválida' }, 'business_rule'],
    [{ code: 'PGRST116', message: 'no rows' }, 'not_found'],
    [{ code: 'PGRST301', message: 'JWT' }, 'auth'],
    [{ message: 'JWT expired' }, 'auth'],
    [{ code: '42501', message: 'permission denied for table budgets' }, 'permission'],
    [{ message: 'new row violates row-level security policy' }, 'permission'],
    [{ message: 'TypeError: Failed to fetch' }, 'network'],
  ] as const)('%o vira code %s', (dbError, code) => {
    const error = toDataError(dbError, FALLBACK)
    expect(error).toBeInstanceOf(DataError)
    expect(error.code).toBe(code)
    expect(error.message).toBe(mapDbError(dbError, FALLBACK))
  })

  it('erro não reconhecido fica sem code e com o fallback', () => {
    const error = toDataError({ code: '42703', message: 'column "x" does not exist' }, FALLBACK)
    expect(error.code).toBeUndefined()
    expect(error.message).toBe(FALLBACK)
  })

  it('errorCode lê o code só de DataError', () => {
    expect(errorCode(new DataError('x', 'network'))).toBe('network')
    expect(errorCode(new DataError('x'))).toBeUndefined()
    expect(errorCode(new Error('Failed to fetch'))).toBeUndefined()
    expect(errorCode(null)).toBeUndefined()
  })

  it('erro que não é DataError mostra a mensagem genérica no plural', () => {
    expect(errorMessage(new Error('boom'))).toBe('Algo deu errado. Tentem de novo.')
  })
})

describe('isNetworkFailure', () => {
  it('AuthRetryableFetchError com status 0 é rede; com 5xx, não', () => {
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError', message: 'x', status: 0 })).toBe(true)
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError', message: 'Bad Gateway', status: 502 })).toBe(false)
  })

  it('reconhece a mensagem do fetch e ignora erros comuns', () => {
    expect(isNetworkFailure({ message: 'Load failed' })).toBe(true)
    expect(isNetworkFailure({ message: 'Invalid login credentials' })).toBe(false)
    expect(isNetworkFailure({})).toBe(false)
  })
})

describe('mensagens no plural (voz "vocês")', () => {
  it('rede, permissão e sessão falam com "vocês"', () => {
    expect(NETWORK_ERROR_MESSAGE).toBe('Sem conexão. Confiram a internet e tentem de novo.')
    expect(PERMISSION_ERROR_MESSAGE).toBe('Vocês não têm permissão para fazer esta alteração.')
    expect(SESSION_EXPIRED_MESSAGE).toBe('A sessão expirou. Entrem de novo.')
  })
})
