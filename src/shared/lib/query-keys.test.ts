import { queryKeys } from '@/shared/lib/query-keys'
import { partialMatchKey } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

// A invalidação do TanStack Query casa por prefixo da chave. Estes testes garantem que
// as chaves "All" usadas depois de salvar/excluir alcançam todas as consultas da área.
describe('chaves das consultas', () => {
  it('AC-04: invalidar budgetsAll alcança as metas de qualquer mês (excluir categoria tira a meta da tela)', () => {
    expect(partialMatchKey(queryKeys.budgets('2026-11'), queryKeys.budgetsAll)).toBe(true)
    expect(partialMatchKey(queryKeys.budgets('2026-10'), queryKeys.budgetsAll)).toBe(true)
  })

  it('AC-04: invalidar transactionsAll alcança o mês e o histórico do painel', () => {
    expect(partialMatchKey(queryKeys.transactions('2026-11'), queryKeys.transactionsAll)).toBe(true)
    expect(partialMatchKey(queryKeys.transactionsRange('2025-12-01', '2026-11-30'), queryKeys.transactionsAll)).toBe(true)
  })

  it('AC-04: as áreas não se invalidam por engano', () => {
    expect(partialMatchKey(queryKeys.budgets('2026-11'), queryKeys.transactionsAll)).toBe(false)
    expect(partialMatchKey(queryKeys.categories, queryKeys.budgetsAll)).toBe(false)
    expect(partialMatchKey(queryKeys.transactions('2026-11'), queryKeys.transactions('2026-10'))).toBe(false)
  })
})
