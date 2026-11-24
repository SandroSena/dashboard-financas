/**
  Posição horizontal de um ponto dentro da área do gráfico, em CSS puro:
  `left` do plot + fração da largura útil. Vira o deslocamento do cursor/dica.
*/
export function plotLeft(fraction: number, { left, right }: { left: number; right: number }): string {
  return `calc(${left}px + (100% - ${left + right}px) * ${Math.min(Math.max(fraction, 0), 1)})`
}
