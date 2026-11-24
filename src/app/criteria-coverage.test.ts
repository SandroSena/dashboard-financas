// AC-30: todo critério marcado [unit] ou [CI] na auditoria tem ao menos um teste com o seu ID
// no nome (no `it`/`test` ou no `describe` que o contém).
import audit from '../../docs/auditoria/2026-11-arquitetura.md?raw'
import { describe, expect, it } from 'vitest'

const testSources = import.meta.glob<string>('/src/**/*.test.ts', { query: '?raw', import: 'default', eager: true })

/** IDs que aparecem nos nomes de testes e describes (só no primeiro argumento, que é o nome). */
function idsInTestNames(): Set<string> {
  const ids = new Set<string>()
  const names = /\b(?:it|test|describe)(?:\.each\([\s\S]*?\))?\(\s*(['"`])([\s\S]*?)\1/g
  for (const code of Object.values(testSources)) {
    for (const match of code.matchAll(names)) {
      for (const id of match[2].match(/\bAC-\d{2}\b/g) ?? []) ids.add(id)
    }
  }
  return ids
}

/** Critérios da seção 5 com a marca [unit] ou [CI] logo depois do ID. */
function automatedCriteria(): string[] {
  return [...audit.matchAll(/\*\*(AC-\d{2})\*\*\s*\[(unit|CI)\]/g)].map((match) => match[1])
}

describe('cobertura dos critérios', () => {
  it('AC-30: a auditoria tem critérios [unit]/[CI] para conferir', () => {
    expect(automatedCriteria().length).toBeGreaterThanOrEqual(10)
  })

  it('AC-30: cada critério [unit] ou [CI] tem ao menos um teste com o seu ID no nome', () => {
    const named = idsInTestNames()
    // O glob não devolve o próprio arquivo de teste em execução; o nome deste teste conta por ele.
    for (const id of expect.getState().currentTestName?.match(/\bAC-\d{2}\b/g) ?? []) named.add(id)
    expect(named.size).toBeGreaterThanOrEqual(10)
    expect(automatedCriteria().filter((id) => !named.has(id))).toEqual([])
  })
})
