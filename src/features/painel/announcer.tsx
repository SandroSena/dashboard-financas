import { AnnounceContext } from '@/features/painel/announce-context'
import { useCallback, useState, type ReactNode } from 'react'

/*
  Região viva única do painel (spec, seção 8): troca de mês, troca de comparação e a
  leitura do cursor no gráfico. Uma só, para o leitor de tela não ouvir avisos sobrepostos.
  Candidata a `shared/` quando outra tela precisar.
*/
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const announce = useCallback((next: string) => {
    // Mesmo texto duas vezes seguidas: acrescenta um espaço para o leitor anunciar de novo.
    setMessage((current) => (current === next ? `${next}\u00a0` : next))
  }, [])
  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </p>
    </AnnounceContext.Provider>
  )
}
