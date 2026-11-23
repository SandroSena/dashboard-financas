import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
  Estado que vale compartilhar fica na URL (ADR-0001, decisão 5). Todo parâmetro é
  validado antes do uso: valor desconhecido vira o padrão e nunca chega a uma query.
*/

/** Converte o texto cru da URL em um valor válido, ou `null` se for inválido. */
export type ParamParser<T> = (raw: string) => T | null

/** Aceita só valores de uma lista fechada (ex.: `?janela=3|6|12`, `?comparar=anterior|media`). */
export function oneOf<const T extends string>(allowed: readonly T[]): ParamParser<T> {
  return (raw) => ((allowed as readonly string[]).includes(raw) ? (raw as T) : null)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Aceita só um UUID (ids do Supabase, ex.: `?categoria=<id>`). Devolve em minúsculas. */
export const uuidParam: ParamParser<string> = (raw) => (UUID.test(raw) ? raw.toLowerCase() : null)

/** Lê um parâmetro: ausente, vazio ou inválido → `fallback`. */
export function readParam<T>(params: URLSearchParams, name: string, parse: ParamParser<T>, fallback: T): T {
  const raw = params.get(name)
  if (raw === null) return fallback
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  const parsed = parse(trimmed)
  return parsed === null ? fallback : parsed
}

/**
  Monta os próximos parâmetros sem mexer nos outros (`?mes=` continua).
  `null` ou o próprio padrão removem o parâmetro, para o link ficar curto.
*/
export function withParam(
  params: URLSearchParams,
  name: string,
  value: string | null,
  fallback?: string | null,
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (value === null || value === '' || (fallback !== undefined && fallback !== null && value === fallback)) {
    next.delete(name)
  } else {
    next.set(name, value)
  }
  return next
}

type Options<T> = {
  parse: ParamParser<T>
  fallback: T
  /**
    `push` (padrão) cria entrada no histórico: o "Voltar" desfaz (ex.: fechar a folha de detalhe).
    `replace` troca sem histórico (ex.: aba de uma tela).
  */
  history?: 'push' | 'replace'
}

/**
  Lê e grava um parâmetro validado da URL.

  @example
  const [janela, setJanela] = useSearchParam('janela', { parse: oneOf(['3', '6', '12']), fallback: '6' })
  const [categoria, setCategoria] = useSearchParam('categoria', { parse: uuidParam, fallback: null })
*/
export function useSearchParam<T extends string | null>(
  name: string,
  { parse, fallback, history = 'push' }: Options<T>,
): [T, (next: T | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = readParam(searchParams, name, parse as ParamParser<T>, fallback)

  const setValue = useCallback(
    (next: T | null) => {
      setSearchParams((current) => withParam(current, name, next, fallback), { replace: history === 'replace' })
    },
    [fallback, history, name, setSearchParams],
  )

  return [value, setValue]
}
