import { cn } from '@/shared/lib/utils'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'

/**
  Conteúdo flutuante com controles (seletor de mês, janela/comparação do painel).
  Radix cuida de colisão, foco, `Esc` (devolve o foco ao gatilho) e `aria-expanded`.

  @example
  <Popover>
    <PopoverTrigger asChild><Button>Escolher</Button></PopoverTrigger>
    <PopoverContent aria-label="Escolher mês">...</PopoverContent>
  </Popover>
*/
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export function PopoverContent({
  className,
  sideOffset = 8,
  align = 'center',
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={12}
        className={cn(
          'pop-in z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-control bg-popover p-3 text-popover-foreground shadow-overlay outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
