/**
  Marca da linha recém-salva (design system 10.11, classe `row-flash` do `index.css`).
  `token` muda a cada salvamento: a tela usa ele como `key` do realce, e a animação
  recomeça mesmo quando a mesma linha é salva duas vezes seguidas.
*/
export type RowFlashMark = { id: string | null; token: number }

export const NO_FLASH: RowFlashMark = { id: null, token: 0 }

/** Próxima marca para a linha `id` (sempre um token novo). */
export function nextFlash(current: RowFlashMark, id: string): RowFlashMark {
  return { id, token: current.token + 1 }
}

/** Token do realce desta linha, ou `null` quando ela não foi a última salva. */
export function flashTokenFor(mark: RowFlashMark, id: string): number | null {
  return mark.id === id && mark.token > 0 ? mark.token : null
}
