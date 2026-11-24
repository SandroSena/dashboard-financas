import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Ação de cabeçalho de card ("Ver todos", "Ajustar metas"): link com toque de 44px. */
export function CardLink({ to, children, label }: { to: string; children: ReactNode; label?: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-body-sm font-semibold text-brand transition-colors duration-(--duration-fast) hover:bg-brand-soft pointer-coarse:h-11"
    >
      {children}
    </Link>
  )
}
