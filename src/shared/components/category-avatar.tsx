import { categoryColorVar, categorySoftColor } from '@/shared/lib/category-colors'
import { cn } from '@/shared/lib/utils'

const sizeClass = {
  sm: 'size-7 text-caption',
  md: 'size-9 text-body-sm',
  lg: 'size-10 text-body',
} as const

/**
  Inicial da categoria num círculo (design system 4.2 e 10.11). A cor gravada no banco
  (nova, antiga ou desconhecida) é resolvida para um slot da paleta, que tem contraste
  garantido nos dois temas: texto `var(--cat-*)` sobre 16% da mesma cor.
  Decorativo: o nome da categoria sempre aparece escrito ao lado.
*/
export function CategoryAvatar({
  name,
  color,
  size = 'md',
  className,
}: {
  /** Nome da categoria; sem categoria, mostra "?". */
  name: string | null | undefined
  /** Hex gravado em `categories.color`. */
  color: string | null | undefined
  size?: keyof typeof sizeClass
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-display font-semibold',
        sizeClass[size],
        className,
      )}
      style={{ color: categoryColorVar(color), backgroundColor: categorySoftColor(color) }}
      aria-hidden="true"
    >
      {(name?.trim().charAt(0) || '?').toUpperCase()}
    </span>
  )
}

/** Ponto de cor da categoria em listas e legendas (sempre com o nome escrito ao lado). */
export function CategoryDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return (
    <span
      className={cn('size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: categoryColorVar(color) }}
      aria-hidden="true"
    />
  )
}
