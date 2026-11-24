import { cn } from '@/shared/lib/utils'
import { controlClass } from '@/shared/ui/control'
import { useFieldControl } from '@/shared/ui/field-context'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

/**
  `<select>` nativo reestilizado (ADR-0001: sem Radix Select). A seta é um ícone em
  `currentColor` (`muted-foreground`), não um SVG com cor fixa.
  `className` vai no contêiner (largura, margem); `selectClassName`, no próprio select.
*/
export function NativeSelect({
  className,
  selectClassName,
  ...props
}: ComponentProps<'select'> & { selectClassName?: string }) {
  const field = useFieldControl(props)
  return (
    <div className={cn('relative w-full', className)}>
      <select
        className={cn(controlClass, 'cursor-pointer appearance-none pr-10', selectClassName)}
        {...props}
        {...field}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
