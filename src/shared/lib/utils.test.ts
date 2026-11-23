import { describe, expect, it } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('cn com os tokens do design system', () => {
  it('mantém tamanho de texto e cor de texto juntos', () => {
    expect(cn('text-body-sm', 'text-foreground')).toBe('text-body-sm text-foreground')
  })

  it('o último tamanho de texto vence', () => {
    expect(cn('text-body-sm', 'text-title')).toBe('text-title')
  })

  it('mantém sombra de token e cor de fundo; o último raio vence', () => {
    expect(cn('shadow-edge bg-card', 'shadow-raised')).toBe('bg-card shadow-raised')
    expect(cn('rounded-card', 'rounded-control')).toBe('rounded-control')
  })
})
