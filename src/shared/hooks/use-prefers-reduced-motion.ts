import { useCallback, useSyncExternalStore } from 'react'

/** Acompanha uma media query (ex.: `(min-width: 768px)`), atualizando quando ela muda. */
export function useMediaQuery(query: string): boolean {
  // `subscribe` estável: com uma função nova a cada render, o React refaria a inscrição toda vez.
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    [query],
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
  Única fonte do "reduzir movimento" para o JS (design system, seção 7).
  O CSS já zera as durações; isto desliga o que o CSS não alcança, como a
  animação do Recharts: `isAnimationActive={!reducedMotion}`.
*/
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
