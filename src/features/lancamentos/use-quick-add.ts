import type { Prefill } from '@/features/lancamentos/form-defaults'
import { createContext, useContext } from 'react'

export type QuickAdd = {
  /** Abre o diálogo vazio. Pode ser passado direto como `onClick` (ignora o evento). */
  open: () => void
  /**
    Abre com pré-preenchimento vindo do painel: `{ occurredOn: '2026-11-12' }`,
    `{ kind: 'income' }` ou `{ categoryId }`. Valores inválidos são ignorados.
  */
  openWith: (prefill: Prefill) => void
  /** Pode abrir: as categorias já carregaram (com ou sem categoria; sem, o diálogo explica o que fazer). */
  ready: boolean
  /** As categorias ainda estão carregando (o botão fica desabilitado com a dica "Carregando categorias..."). */
  loading: boolean
}

/** Fica separado de `quick-add.tsx` para aquele arquivo exportar só componentes (fast refresh). */
export const QuickAddContext = createContext<QuickAdd | null>(null)

export function useQuickAdd(): QuickAdd {
  const value = useContext(QuickAddContext)
  if (!value) throw new Error('useQuickAdd precisa ficar dentro de QuickAddProvider')
  return value
}
