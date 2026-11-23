import { pickReturnTarget } from '@/shared/lib/return-focus'
import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react'

/**
  Alvo genérico: o diálogo que continua aberto por baixo (ex.: a folha, quando o
  formulário aberto por cima dela fecha) ou o conteúdo principal (`#conteudo`).
*/
function genericTarget(): HTMLElement | null {
  const open = document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"]')
  const below = open.item(open.length - 1)
  if (below) return below.querySelector<HTMLElement>('[tabindex="-1"]') ?? below
  return document.getElementById('conteudo')
}

/**
  Ninguém aqui usa `DialogTrigger`, então o Radix não sabe quem abriu e o foco cairia
  no `body`. Este hook guarda o elemento focado quando `open` vira `true` (antes de o
  Radix mover o foco para dentro) e devolve o `onCloseAutoFocus` que volta para ele.
*/
export function useReturnFocus(
  open: boolean,
  fallbackRef?: RefObject<HTMLElement | null>,
  priority: 'opener' | 'ref' = 'opener',
) {
  const opener = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const active = document.activeElement
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null
  }, [open])

  return useCallback(
    (event: Event) => {
      event.preventDefault()
      const target = pickReturnTarget(opener.current, fallbackRef?.current ?? null, genericTarget, priority)
      opener.current = null
      target?.focus()
    },
    [fallbackRef, priority],
  )
}
