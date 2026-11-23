import { cn } from '@/shared/lib/utils'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentProps, ReactNode } from 'react'

/** Um só provider, em `app.tsx`. Atraso de 400ms para abrir (design system 10.7). */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={300}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

/**
  Dica de controle: rótulo curto para botão só de ícone, ou explicação de um indicador.
  Abre no hover e no foco do teclado, fecha com Esc, e o texto vira descrição do gatilho
  (`aria-describedby`). Nunca leva informação que não esteja em outro lugar
  (no `aria-label` do botão ou no texto da tela).

  @example
  <Tooltip content="Usar tema claro"><Button size="icon" aria-label="Usar tema claro">...</Button></Tooltip>
*/
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  open,
  onOpenChange,
}: {
  content: ReactNode
  /** Um único elemento focável (botão, link); recebe as props do gatilho. */
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export function TooltipContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        'pop-in z-[60] max-w-72 rounded-control bg-popover px-3 py-2 text-caption text-popover-foreground shadow-overlay',
        className,
      )}
      {...props}
    />
  )
}

export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
