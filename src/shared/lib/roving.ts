/**
  Próximo índice de um grupo de rádios com foco itinerante (ARIA radiogroup): setas andam
  e dão a volta nas pontas, Home/End vão às pontas. Tecla que não navega → `null`.
  Usado nos chips de categoria do diálogo de lançamento.
*/
export function nextRadioIndex(index: number, key: string, count: number): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
