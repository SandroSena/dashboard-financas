/** O que o retorno de foco precisa saber de um elemento (facilita o teste sem DOM). */
export type FocusCandidate = { isConnected: boolean; focus: (options?: FocusOptions) => void }

/**
  Para onde o foco volta quando um diálogo ou uma folha fecha (AC-14, UX-28), em ordem:
  quem abriu (se ainda está na página), o alvo de reserva da tela e, por último, o
  alvo genérico (o diálogo que continua aberto por baixo ou o conteúdo principal).
  Com `priority: 'ref'`, o alvo da tela vem antes de quem abriu (a tela sabe melhor,
  ex.: depois de excluir, o card seguinte).
*/
export function pickReturnTarget<T extends FocusCandidate>(
  opener: T | null,
  fallback: T | null,
  generic: () => T | null,
  priority: 'opener' | 'ref' = 'opener',
): T | null {
  const ordered = priority === 'ref' ? [fallback, opener] : [opener, fallback]
  return ordered.find((candidate) => candidate?.isConnected) ?? generic()
}
