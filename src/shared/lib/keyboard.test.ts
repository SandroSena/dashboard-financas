import { describe, expect, it } from 'vitest'
import { hasOpenDialog, isEditableTarget, matchesShortcut } from '@/shared/lib/keyboard'

const body = { tagName: 'BODY', closest: () => null }
const input = { tagName: 'INPUT', closest: () => null }
const insideDialog = { tagName: 'BUTTON', closest: () => ({}) }

describe('atalhos de teclado', () => {
  it('UX-02: N com o foco fora de campos dispara o atalho', () => {
    expect(matchesShortcut({ key: 'n', target: body }, 'n')).toBe(true)
    expect(matchesShortcut({ key: 'N', target: body }, 'n')).toBe(true)
  })

  it('UX-03: N num campo de texto, select ou área editável não dispara', () => {
    expect(matchesShortcut({ key: 'n', target: input }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: { tagName: 'select', closest: () => null } }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: { tagName: 'DIV', isContentEditable: true, closest: () => null } }, 'n')).toBe(
      false,
    )
  })

  it('não dispara dentro de diálogo, com modificador ou durante composição', () => {
    expect(matchesShortcut({ key: 'n', target: insideDialog }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: body, ctrlKey: true }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: body, metaKey: true }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: body, isComposing: true }, 'n')).toBe(false)
    expect(matchesShortcut({ key: 'n', target: body, defaultPrevented: true }, 'n')).toBe(false)
  })

  it('outra tecla não dispara', () => {
    expect(matchesShortcut({ key: '[', target: body }, ']')).toBe(false)
  })

  it('isEditableTarget aceita alvos nulos ou estranhos', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget('x')).toBe(false)
  })

  it('hasOpenDialog procura diálogos abertos', () => {
    expect(hasOpenDialog({ querySelector: () => ({}) })).toBe(true)
    expect(hasOpenDialog({ querySelector: () => null })).toBe(false)
    expect(hasOpenDialog(undefined)).toBe(false)
  })
})
