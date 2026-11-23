import { createContext, useContext } from 'react'

type FieldContextValue = {
  id: string
  describedBy: string | undefined
  invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

/**
  Controles dentro de um `Field` herdam `id`, `aria-describedby` e `aria-invalid`.
  Props passadas direto no controle sempre vencem.
*/
export function useFieldControl(props: {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
}) {
  const field = useContext(FieldContext)
  return {
    id: props.id ?? field?.id,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : undefined),
  }
}
