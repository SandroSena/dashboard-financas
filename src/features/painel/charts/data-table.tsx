import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

/**
  Alternativa em tabela de todo gráfico (design system 10.11, UX-47, AC-19): `<table>` real
  com `<caption>`, cabeçalho fixo e números à direita.
*/
export function DataTable({
  caption,
  columns,
  rows,
  rowKeys,
}: {
  caption: string
  columns: string[]
  rows: ReadonlyArray<ReadonlyArray<ReactNode>>
  rowKeys?: string[]
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-control inset-ring inset-ring-border">
      <table className="w-full text-body-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-sunken text-label text-muted-foreground">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={cn('px-3 py-2 font-semibold', index === 0 ? 'text-left' : 'text-right')}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowKeys?.[rowIndex] ?? rowIndex} className="border-t border-border">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row" className="px-3 py-2 text-left font-medium">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="figure px-3 py-2 text-right">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
