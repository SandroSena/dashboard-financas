import { cn } from '@/shared/lib/utils'
import type { HTMLAttributes } from 'react'

/**
  Bloco de esqueleto (design system 10.8). Dê a ele as MESMAS medidas do conteúdo final.
  É decorativo: o contêiner da área é quem leva `role="status"`, `aria-busy` e o rótulo
  (ver `LoadingRegion` em `shared/components/feedback.tsx`). Com movimento reduzido o brilho para.
*/
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />
}
