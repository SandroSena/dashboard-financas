import {
  needsCanonicalUrl,
  readFilters,
  writeFilters,
  type TransactionFilters,
} from '@/features/lancamentos/filters'
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router'

type FiltersUpdate = TransactionFilters | ((current: TransactionFilters) => TransactionFilters)

/**
  Filtros de Lançamentos na URL (`tipo`, `categoria`, `busca`), sempre com `replace`
  para não encher o histórico. Valor inválido cai no padrão e a URL é reescrita no
  formato oficial (ex.: `tipo=expense` → `tipo=gastos`, `categoria=abc` sai).
*/
export function useTransactionFilters(): [TransactionFilters, (update: FiltersUpdate) => void] {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)

  const setFilters = useCallback(
    (update: FiltersUpdate) => {
      setParams(
        (current) => {
          const next = typeof update === 'function' ? update(readFilters(current)) : update
          return writeFilters(current, next)
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    if (needsCanonicalUrl(params)) setParams((current) => writeFilters(current, readFilters(current)), { replace: true })
  }, [params, setParams])

  return [filters, setFilters]
}
