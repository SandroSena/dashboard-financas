import { pickReturnTarget, type FocusCandidate } from '@/shared/lib/return-focus'
import { describe, expect, it } from 'vitest'

function element(isConnected: boolean): FocusCandidate {
  return { isConnected, focus: () => {} }
}

describe('retorno de foco ao fechar diálogo ou folha (AC-14, UX-28)', () => {
  it('volta para quem abriu quando ele ainda está na página', () => {
    const opener = element(true)
    expect(pickReturnTarget(opener, element(true), () => element(true))).toBe(opener)
  })

  it('usa a reserva da tela quando quem abriu sumiu (ex.: linha excluída)', () => {
    const fallback = element(true)
    expect(pickReturnTarget(element(false), fallback, () => element(true))).toBe(fallback)
  })

  it("com prioridade 'ref', o alvo da tela vence quem abriu (ex.: card seguinte depois de excluir)", () => {
    const opener = element(true)
    const target = element(true)
    expect(pickReturnTarget(opener, target, () => null, 'ref')).toBe(target)
    expect(pickReturnTarget(opener, element(false), () => null, 'ref')).toBe(opener)
  })

  it('cai no alvo genérico sem quem abriu nem reserva', () => {
    const generic = element(true)
    expect(pickReturnTarget(null, null, () => generic)).toBe(generic)
    expect(pickReturnTarget(element(false), element(false), () => generic)).toBe(generic)
  })
})
