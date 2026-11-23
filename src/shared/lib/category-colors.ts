/**
  Paleta categórica do design system "Régua" (docs/design/design-system.md, seção 4.2).

  O banco continua guardando um hex em `categories.color`. O hex gravado é o valor
  CLARO do slot (ex.: `#2563eb`) e funciona como identificador: a tela pinta com
  `var(--cat-azul)`, que troca sozinho no tema escuro (tokens em `src/index.css`).

  Cores antigas (inclusive verde, vermelho e âmbar, reservados para receita, gasto e
  alerta) são mapeadas para um slot aqui no frontend, sem migração. Hex desconhecido
  vira Ardósia, a mesma cor de "Outras" e de lançamento sem categoria.
*/

export type CategorySlotId = 'azul' | 'roxo' | 'laranja' | 'fucsia' | 'ouro' | 'ciano' | 'cafe' | 'ardosia'

export type CategorySlot = {
  id: CategorySlotId
  /** Nome mostrado na tela e lido pelo leitor de tela. */
  name: string
  /** Valor gravado no banco (versão clara do slot). */
  hex: string
  /** Cor para `style`: troca sozinha entre o tema claro e o escuro. */
  cssVar: string
}

function slot(id: CategorySlotId, name: string, hex: string): CategorySlot {
  return { id, name, hex, cssVar: `var(--cat-${id})` }
}

/** Ordem da grade do diálogo de categoria. */
export const CATEGORY_SLOTS: readonly CategorySlot[] = [
  slot('azul', 'Azul', '#2563eb'),
  slot('roxo', 'Roxo', '#7c3aed'),
  slot('laranja', 'Laranja', '#c2410c'),
  slot('fucsia', 'Fúcsia', '#a21caf'),
  slot('ouro', 'Ouro', '#a16207'),
  slot('ciano', 'Ciano', '#0e7490'),
  slot('cafe', 'Café', '#8a5a2b'),
  slot('ardosia', 'Ardósia', '#64748b'),
]

export const FALLBACK_SLOT_ID: CategorySlotId = 'ardosia'

/** Versões escuras dos slots: se alguém gravou a cor do tema escuro, ainda resolve para o mesmo slot. */
const DARK_HEX: Record<CategorySlotId, string> = {
  azul: '#60a5fa',
  roxo: '#a78bfa',
  laranja: '#fb923c',
  fucsia: '#e879f9',
  ouro: '#facc15',
  ciano: '#22d3ee',
  cafe: '#d6a26e',
  ardosia: '#94a3b8',
}

/** Paleta antiga (15 cores livres) → slot novo. Tabela da seção 4.2 do design system. */
const LEGACY_HEX: Record<string, CategorySlotId> = {
  '#f97316': 'laranja',
  '#6366f1': 'azul',
  '#0ea5e9': 'ciano',
  '#14b8a6': 'ciano',
  '#ec4899': 'fucsia',
  '#8b5cf6': 'roxo',
  '#eab308': 'ouro',
  '#64748b': 'ardosia',
  '#16a34a': 'ciano',
  '#22c55e': 'ciano',
  '#84cc16': 'ouro',
  '#ef4444': 'laranja',
  '#0891b2': 'ciano',
  '#a855f7': 'roxo',
  '#f59e0b': 'ouro',
}

const BY_ID = new Map(CATEGORY_SLOTS.map((item) => [item.id, item]))
const BY_HEX = new Map<string, CategorySlot>()
for (const item of CATEGORY_SLOTS) {
  BY_HEX.set(item.hex, item)
  BY_HEX.set(DARK_HEX[item.id], item)
}

function normalize(hex: string | null | undefined): string {
  return (hex ?? '').trim().toLowerCase()
}

/** Slot de uma cor gravada (nova, antiga ou desconhecida). Nunca falha: o padrão é Ardósia. */
export function categorySlot(hex: string | null | undefined): CategorySlot {
  const key = normalize(hex)
  const direct = BY_HEX.get(key)
  if (direct) return direct
  const legacy = LEGACY_HEX[key]
  return BY_ID.get(legacy ?? FALLBACK_SLOT_ID) as CategorySlot
}

/** `var(--cat-*)` para usar em `style` (fundo, texto, preenchimento de gráfico). */
export function categoryColorVar(hex: string | null | undefined): string {
  return categorySlot(hex).cssVar
}

/** Fundo suave da categoria (círculo da inicial): 16% da cor sobre transparente. */
export function categorySoftColor(hex: string | null | undefined): string {
  return `color-mix(in oklab, ${categoryColorVar(hex)} 16%, transparent)`
}

/** A cor já é um slot da paleta nova (valor gravado igual ao hex claro do slot)? */
export function isPaletteColor(hex: string | null | undefined): boolean {
  const key = normalize(hex)
  return CATEGORY_SLOTS.some((item) => item.hex === key)
}
