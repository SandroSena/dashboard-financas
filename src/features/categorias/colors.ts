/**
  As cores de categoria moram em `src/shared/lib/category-colors.ts`, porque peças
  compartilhadas (avatar, gráficos) também precisam delas e `shared` não importa `features`.
*/
export { CATEGORY_SLOTS, categorySlot, isPaletteColor } from '@/shared/lib/category-colors'
