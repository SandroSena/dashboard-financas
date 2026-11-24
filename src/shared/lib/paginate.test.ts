import { balanceOf, totalByKind } from '@/domain/summary'
import type { Transaction } from '@/domain/types'
import { fetchAllPages, PAGE_SIZE, PageFetchError, type PageResponse } from '@/shared/lib/paginate'
import { DataError, listAllPages, NETWORK_ERROR_MESSAGE } from '@/shared/lib/supabase'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Fake do `.range(from, to)` do PostgREST: devolve a fatia pedida, cortada em
 * `maxRows` linhas (o `max_rows` do servidor), e pode falhar numa página.
 */
function fakeTable<Row>(rows: Row[], options: { maxRows?: number; failOnPage?: number; pageSize?: number } = {}) {
  const maxRows = options.maxRows ?? PAGE_SIZE
  const pageSize = options.pageSize ?? PAGE_SIZE
  const calls: Array<[number, number]> = []
  const fetchPage = async (from: number, to: number): Promise<PageResponse<Row>> => {
    calls.push([from, to])
    if (options.failOnPage !== undefined && from === options.failOnPage * pageSize) {
      return { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }
    }
    const end = Math.min(to + 1, from + maxRows)
    return { data: rows.slice(from, end), error: null }
  }
  return { fetchPage, calls }
}

function makeTransactions(count: number): Transaction[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `t${index}`,
    categoryId: index % 3 === 0 ? 'salary' : 'food',
    kind: index % 3 === 0 ? 'income' : 'expense',
    description: `Lançamento ${index}`,
    // valores com centavos, para pegar erro de ponto flutuante
    amount: Number((10.1 + (index % 7) * 0.33).toFixed(2)),
    occurredOn: '2026-11-01',
  }))
}

function sumCents(transactions: Transaction[], kind: Transaction['kind']): number {
  return transactions.filter((t) => t.kind === kind).reduce((total, t) => total + Math.round(t.amount * 100), 0)
}

describe('fetchAllPages', () => {
  it('AC-01: junta 1.500 linhas em duas páginas de 1000 e os totais batem em centavos', async () => {
    const all = makeTransactions(1500)
    const { fetchPage, calls } = fakeTable(all)

    const result = await fetchAllPages(fetchPage)

    expect(result).toHaveLength(1500)
    expect(result.map((t) => t.id)).toEqual(all.map((t) => t.id))
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    const income = sumCents(all, 'income')
    const expense = sumCents(all, 'expense')
    expect(Math.round(totalByKind(result, 'income') * 100)).toBe(income)
    expect(Math.round(totalByKind(result, 'expense') * 100)).toBe(expense)
    expect(Math.round(balanceOf(result) * 100)).toBe(income - expense)
  })

  it('AC-01: com exatamente 1000 linhas pede mais uma página e para na vazia', async () => {
    const { fetchPage, calls } = fakeTable(makeTransactions(1000))

    const result = await fetchAllPages(fetchPage)

    expect(result).toHaveLength(1000)
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it('AC-01: lista vazia faz uma chamada e devolve []', async () => {
    const { fetchPage, calls } = fakeTable<Transaction>([])

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([])
    expect(calls).toHaveLength(1)
  })

  it('AC-01: trata data null como página vazia', async () => {
    const result = await fetchAllPages<Transaction>(async () => ({ data: null, error: null }))
    expect(result).toEqual([])
  })

  it('AC-01: respeita um pageSize menor', async () => {
    const { fetchPage, calls } = fakeTable(makeTransactions(5), { pageSize: 2 })

    const result = await fetchAllPages(fetchPage, { pageSize: 2 })

    expect(result).toHaveLength(5)
    expect(calls).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ])
  })

  it('AC-02: rejeita com PageFetchError se a segunda página falha', async () => {
    const { fetchPage, calls } = fakeTable(makeTransactions(1500), { failOnPage: 1 })

    const error = await fetchAllPages(fetchPage).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(PageFetchError)
    expect((error as PageFetchError).dbError.code).toBe('57014')
    expect(calls).toHaveLength(2)
  })

  it('rejeita se passar do limite de páginas, em vez de devolver dado cortado', async () => {
    const fullPage = async (): Promise<PageResponse<number>> => ({ data: [1, 2], error: null })

    await expect(fetchAllPages(fullPage, { pageSize: 2, maxPages: 3 })).rejects.toBeInstanceOf(PageFetchError)
  })

  it('recusa pageSize inválido', async () => {
    const { fetchPage } = fakeTable([1])
    await expect(fetchAllPages(fetchPage, { pageSize: 0 })).rejects.toBeInstanceOf(RangeError)
  })
})

describe('listAllPages', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('AC-01: devolve todas as linhas quando nenhuma página falha', async () => {
    const { fetchPage } = fakeTable(makeTransactions(2500))
    await expect(listAllPages(fetchPage, 'Falhou.')).resolves.toHaveLength(2500)
  })

  it('AC-02: segunda página falha, então DataError com mensagem amigável e nenhum dado parcial', async () => {
    const { fetchPage } = fakeTable(makeTransactions(1500), { failOnPage: 1 })

    const error = await listAllPages(fetchPage, 'Não foi possível carregar os lançamentos.').catch(
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(DataError)
    expect((error as DataError).message).toBe('Não foi possível carregar os lançamentos.')
    expect((error as DataError).message).not.toContain('statement timeout')
  })

  it('AC-02: falha de rede numa página vira a mensagem de conexão', async () => {
    const fetchPage = async (): Promise<PageResponse<Transaction>> => ({
      data: null,
      error: { message: 'TypeError: Failed to fetch' },
    })

    const error = await listAllPages(fetchPage, 'Falhou.').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(DataError)
    expect((error as DataError).message).toBe(NETWORK_ERROR_MESSAGE)
    expect((error as DataError).code).toBe('network')
  })

  it('AC-02: exceção inesperada do fetchPage vira DataError com o fallback', async () => {
    const fetchPage = async (): Promise<PageResponse<Transaction>> => {
      throw new Error('boom interno')
    }

    const error = await listAllPages(fetchPage, 'Falhou.').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(DataError)
    expect((error as DataError).message).toBe('Falhou.')
  })
})
