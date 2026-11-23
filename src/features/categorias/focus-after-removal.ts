/**
  Depois de excluir uma categoria, o foco vai para o card seguinte na ordem da grade
  (WCAG 2.4.3). Sem card seguinte, devolve `null` e a tela foca "Nova categoria".
*/
export function nextFocusId(orderedIds: readonly string[], removedId: string): string | null {
  const index = orderedIds.indexOf(removedId)
  if (index === -1) return null
  return orderedIds[index + 1] ?? null
}
