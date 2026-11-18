/** Diz se alguma linha tem um valor numérico diferente de zero nas chaves pedidas. */
export function hasNumbers(rows: readonly object[], keys: readonly string[]): boolean {
  return rows.some((row) =>
    keys.some((key) => {
      const value = (row as Record<string, unknown>)[key]
      return typeof value === 'number' && value !== 0
    }),
  )
}
