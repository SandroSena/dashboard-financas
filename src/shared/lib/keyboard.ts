/**
  Atalhos globais (N = novo lançamento, [ e ] = mês anterior/próximo) só valem quando
  a pessoa não está digitando nem dentro de um diálogo (shell-navegacao.md, seção 7).
*/

type TargetLike = {
  tagName?: string
  isContentEditable?: boolean
  closest?: (selector: string) => unknown
} | null

type KeyEventLike = {
  key: string
  target: unknown
  defaultPrevented?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  isComposing?: boolean
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** O foco está num campo, num select ou em algo editável? */
export function isEditableTarget(target: unknown): boolean {
  const element = target as TargetLike
  if (!element || typeof element !== 'object') return false
  if (element.isContentEditable) return true
  return EDITABLE_TAGS.has((element.tagName ?? '').toUpperCase())
}

/** O foco está dentro de um diálogo, folha ou popover aberto? */
export function isInsideOverlay(target: unknown): boolean {
  const element = target as TargetLike
  if (!element || typeof element.closest !== 'function') return false
  return Boolean(element.closest('[role="dialog"], [role="alertdialog"]'))
}

/**
  A tecla deve disparar o atalho `key`? Ignora campos, diálogos, teclas com modificador
  (Ctrl+N abre janela no navegador) e composição de acentos (IME).
*/
export function matchesShortcut(event: KeyEventLike, key: string): boolean {
  if (event.defaultPrevented || event.isComposing) return false
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  if (event.key.toLowerCase() !== key.toLowerCase()) return false
  if (isEditableTarget(event.target) || isInsideOverlay(event.target)) return false
  return true
}

/** Há um diálogo aberto na página (nesse caso os atalhos globais ficam desligados)? */
export function hasOpenDialog(doc: { querySelector: (selector: string) => unknown } | undefined): boolean {
  if (!doc) return false
  return Boolean(doc.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'))
}
