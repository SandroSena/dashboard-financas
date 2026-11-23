import { createContext, useContext } from 'react'

/** Anuncia uma frase na região viva única do painel (ver `announcer.tsx`). */
export const AnnounceContext = createContext<(message: string) => void>(() => {})

export function useAnnounce(): (message: string) => void {
  return useContext(AnnounceContext)
}
