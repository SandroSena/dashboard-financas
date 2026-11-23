import type { SegmentedOption } from '@/shared/ui/segmented'
import { ChartColumn, Table2 } from 'lucide-react'

export type ChartView = 'chart' | 'table'

/** Opções do botão gráfico/tabela, usadas com `<Segmented iconOnly />` (substitui o ViewToggle). */
export const VIEW_OPTIONS: ReadonlyArray<SegmentedOption<ChartView>> = [
  { value: 'chart', label: 'Ver gráfico', icon: ChartColumn },
  { value: 'table', label: 'Ver tabela', icon: Table2 },
]
