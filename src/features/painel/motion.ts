import { toCents } from '@/domain/money'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { useEffect, useRef, useState } from 'react'

/*
  Movimento do painel (spec, seção 6). As durações vêm dos tokens de `src/index.css`
  (`--duration-*`), lidas em tempo de execução: com "reduzir movimento" o CSS já as zera.
  Candidatos a `src/shared/hooks/` quando outra tela precisar.
*/

const FALLBACK_MS: Record<string, number> = {
  '--duration-base': 220,
  '--duration-slow': 360,
  '--duration-chart': 700,
  '--duration-hero': 900,
}

/** Lê um token de duração (`"900ms"` → 900). */
export function readDuration(token: keyof typeof FALLBACK_MS | string): number {
  const fallback = FALLBACK_MS[token] ?? 0
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : value * 1000
}

const OPENED_KEY = 'painel:abertura-animada'

/**
  A régua enche e o número conta só na primeira abertura do painel na sessão (UX-10).
  O valor é lido uma vez por montagem; o efeito marca a sessão depois.
*/
export function useFirstOpenInSession(): boolean {
  const [first] = useState(() => {
    try {
      return sessionStorage.getItem(OPENED_KEY) === null
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(OPENED_KEY, '1')
    } catch {
      // Sem storage (modo privado restrito): a animação só roda de novo ao recarregar.
    }
  }, [])
  return first
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
  Contagem do número do destaque: na primeira abertura, de 0 ao valor (`--duration-hero`);
  depois, do valor anterior ao novo (`--duration-slow`). Conta em centavos inteiros.
  Com movimento reduzido, devolve o valor final na hora (UX-11).
*/
export function useCountUp(target: number, { fromZero }: { fromZero: boolean }): number {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(() => (fromZero && !reduced ? 0 : target))
  const current = useRef(value)
  const firstRun = useRef(true)

  useEffect(() => {
    const isFirst = firstRun.current
    firstRun.current = false
    const from = current.current
    if (reduced || toCents(from) === toCents(target)) {
      current.current = target
      setValue(target)
      return
    }
    const duration = readDuration(isFirst && fromZero ? '--duration-hero' : '--duration-slow')
    const fromCents = toCents(from)
    const toCentsValue = toCents(target)
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = duration > 0 ? Math.min((now - start) / duration, 1) : 1
      const next = Math.round(fromCents + (toCentsValue - fromCents) * easeOutCubic(progress)) / 100
      current.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reduced, fromZero])

  return value
}
