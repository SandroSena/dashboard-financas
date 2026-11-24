import { isDayOfMonth, parseDashboardParams } from '@/features/painel/params'
import { describe, expect, it } from 'vitest'

const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

describe('parâmetros do painel', () => {
  it('AC-10: ?janela=12 é aceita; 7, 3, abc ou vazia voltam para 6', () => {
    expect(parseDashboardParams(new URLSearchParams('janela=12')).window).toBe(12)
    for (const query of ['janela=7', 'janela=3', 'janela=abc', 'janela=', '']) {
      expect(parseDashboardParams(new URLSearchParams(query)).window).toBe(6)
    }
  })

  it('AC-11 / UX-21: ?comparar=media é lida; valor desconhecido vira anterior', () => {
    expect(parseDashboardParams(new URLSearchParams('comparar=media')).compare).toBe('media')
    expect(parseDashboardParams(new URLSearchParams('comparar=mediana')).compare).toBe('anterior')
    expect(parseDashboardParams(new URLSearchParams('')).compare).toBe('anterior')
  })

  it('AC-15 / UX-29: ?categoria só aceita UUID', () => {
    expect(parseDashboardParams(new URLSearchParams(`categoria=${id}`)).category).toBe(id)
    expect(parseDashboardParams(new URLSearchParams("categoria=1' or '1'='1")).category).toBeNull()
  })

  it('UX-16: ?dia só aceita uma data que existe', () => {
    expect(parseDashboardParams(new URLSearchParams('dia=2026-11-12')).day).toBe('2026-11-12')
    expect(parseDashboardParams(new URLSearchParams('dia=2026-02-30')).day).toBeNull()
    expect(parseDashboardParams(new URLSearchParams('dia=12')).day).toBeNull()
  })

  it('só uma folha por vez: com as duas no link, vale a da categoria', () => {
    const params = parseDashboardParams(new URLSearchParams(`categoria=${id}&dia=2026-11-12`))
    expect(params.category).toBe(id)
    expect(params.day).toBeNull()
  })

  it('isDayOfMonth', () => {
    expect(isDayOfMonth('2026-11-12', '2026-11')).toBe(true)
    expect(isDayOfMonth('2026-10-12', '2026-11')).toBe(false)
  })
})
