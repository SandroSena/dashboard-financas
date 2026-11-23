import type { Kind } from '@/domain/types'

/*
  Contrato fixo de links do painel para as outras telas (a outra metade da etapa 2 lê
  estes parâmetros): `/lancamentos?mes=AAAA-MM&tipo=gastos|receitas&categoria=<id>` e
  `/orcamentos?mes=AAAA-MM&categoria=<id>`.
*/

export function transactionsLink(month: string, { kind, categoryId }: { kind?: Kind; categoryId?: string } = {}): string {
  const params = new URLSearchParams({ mes: month })
  if (kind) params.set('tipo', kind === 'expense' ? 'gastos' : 'receitas')
  if (categoryId) params.set('categoria', categoryId)
  return `/lancamentos?${params.toString()}`
}

export function budgetsLink(month: string, categoryId?: string): string {
  const params = new URLSearchParams({ mes: month })
  if (categoryId) params.set('categoria', categoryId)
  return `/orcamentos?${params.toString()}`
}
