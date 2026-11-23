import { nextFocusId } from '@/features/categorias/focus-after-removal'
import { describe, expect, it } from 'vitest'

describe('nextFocusId: foco depois de excluir uma categoria (WCAG 2.4.3)', () => {
  it('vai para o card seguinte', () => {
    expect(nextFocusId(['a', 'b', 'c'], 'a')).toBe('b')
    expect(nextFocusId(['a', 'b', 'c'], 'b')).toBe('c')
  })

  it('sem card seguinte, devolve null (a tela foca "Nova categoria")', () => {
    expect(nextFocusId(['a', 'b', 'c'], 'c')).toBeNull()
    expect(nextFocusId(['a'], 'a')).toBeNull()
  })

  it('id fora da grade (ex.: outra aba) devolve null', () => {
    expect(nextFocusId(['a', 'b'], 'x')).toBeNull()
  })
})
