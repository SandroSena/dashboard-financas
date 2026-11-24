import { isIsoDate } from '@/domain/month'
import { oneOf, readParam, uuidParam, type ParamParser } from '@/shared/hooks/use-search-param'

/*
  Parâmetros de URL do painel (spec do painel, "Estado na URL"; ADR-0001, decisão 5).
  Tudo é validado antes do uso: valor desconhecido vira o padrão e nunca chega a uma query.
*/

export const COMPARE_MODES = ['anterior', 'media'] as const
export type CompareMode = (typeof COMPARE_MODES)[number]
export const DEFAULT_COMPARE: CompareMode = 'anterior'

/** Janela do gráfico de evolução. 12 meses é o teto (auditoria, pergunta 2). */
export const WINDOW_OPTIONS = ['6', '12'] as const
export type WindowParam = (typeof WINDOW_OPTIONS)[number]
export type HistoryWindow = 6 | 12
export const DEFAULT_WINDOW: WindowParam = '6'
export const MAX_WINDOW: HistoryWindow = 12

export const parseCompare = oneOf(COMPARE_MODES)
export const parseWindow = oneOf(WINDOW_OPTIONS)

/** `?dia=AAAA-MM-DD`, só datas que existem no calendário. */
export const parseDay: ParamParser<string> = (raw) => (isIsoDate(raw) ? raw : null)

/** `?categoria=<uuid>`: ids do Supabase. Id de outra conta não é encontrado (RLS) e a folha não abre. */
export const parseCategory = uuidParam

export type DashboardParams = {
  compare: CompareMode
  window: HistoryWindow
  category: string | null
  day: string | null
}

export function parseDashboardParams(params: URLSearchParams): DashboardParams {
  const category = readParam(params, 'categoria', parseCategory, null)
  const day = readParam(params, 'dia', parseDay, null)
  return {
    compare: readParam(params, 'comparar', parseCompare, DEFAULT_COMPARE),
    window: Number(readParam(params, 'janela', parseWindow, DEFAULT_WINDOW)) as HistoryWindow,
    // Só uma folha por vez: se as duas vierem no link, vale a da categoria.
    category,
    day: category ? null : day,
  }
}

/** O dia (`AAAA-MM-DD`) pertence ao mês (`AAAA-MM`)? */
export function isDayOfMonth(day: string, month: string): boolean {
  return day.startsWith(`${month}-`)
}
