/**
 * Busca todas as páginas de uma listagem do Supabase (PostgREST).
 *
 * O PostgREST devolve no máximo `max_rows` linhas por requisição (1000 no
 * Supabase, por padrão) e corta o resto sem erro. Por isso toda listagem sem
 * limite passa por aqui, pedindo páginas com `.range(from, to)` até vir uma
 * página incompleta.
 *
 * Regras:
 * - A consulta montada em `fetchPage` precisa ter ordem total e estável
 *   (terminando numa coluna única, como `id`), senão linhas podem se repetir
 *   ou sumir entre páginas.
 * - Se qualquer página falhar, a chamada inteira rejeita: nunca devolve um
 *   resultado parcial.
 * - `pageSize` não pode ser maior que o `max_rows` do projeto. Com o padrão do
 *   Supabase (1000) isso vale.
 */

export const PAGE_SIZE = 1000

/** Limite de segurança contra laço infinito (1000 páginas = 1 milhão de linhas). */
export const MAX_PAGES = 1000

export type PageResponse<Row> = {
  data: Row[] | null
  error: { code?: string; message?: string } | null
}

export type FetchPage<Row> = (from: number, to: number) => PromiseLike<PageResponse<Row>>

export class PageFetchError extends Error {
  readonly dbError: { code?: string; message?: string }

  constructor(dbError: { code?: string; message?: string }) {
    super('Falha ao buscar uma página')
    this.name = 'PageFetchError'
    this.dbError = dbError
  }
}

export async function fetchAllPages<Row>(
  fetchPage: FetchPage<Row>,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<Row[]> {
  const pageSize = options.pageSize ?? PAGE_SIZE
  const maxPages = options.maxPages ?? MAX_PAGES
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('pageSize precisa ser um inteiro positivo')
  }

  const rows: Row[] = []
  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await fetchPage(from, to)
    if (error) throw new PageFetchError(error)

    const pageRows = data ?? []
    rows.push(...pageRows)
    if (pageRows.length < pageSize) return rows
  }

  // Passou do limite sem achar o fim: falha em vez de devolver dado cortado.
  throw new PageFetchError({ message: 'Limite de páginas excedido' })
}
