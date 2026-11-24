import { flashTokenFor, nextFlash, NO_FLASH } from '@/shared/lib/row-flash'
import { describe, expect, it } from 'vitest'

describe('marca da linha salva (row-flash)', () => {
  it('cada salvamento gera um token novo, mesmo na mesma linha', () => {
    const first = nextFlash(NO_FLASH, 'a')
    const second = nextFlash(first, 'a')
    expect(first).toEqual({ id: 'a', token: 1 })
    expect(second).toEqual({ id: 'a', token: 2 })
  })

  it('só a última linha salva recebe o token', () => {
    const mark = nextFlash(nextFlash(NO_FLASH, 'a'), 'b')
    expect(flashTokenFor(mark, 'b')).toBe(2)
    expect(flashTokenFor(mark, 'a')).toBeNull()
  })

  it('sem salvamento, nenhuma linha acende', () => {
    expect(flashTokenFor(NO_FLASH, 'a')).toBeNull()
  })
})
