import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useReturnFocus } from '@/shared/ui/use-return-focus'
import { useRef, type ReactNode, type RefObject } from 'react'

/**
  Folha lateral (design system 10.5), sobre o Radix Dialog. Desktop: painel de 26rem
  à direita, altura total. Celular (< 640px): folha de baixo até 92% da altura.
  Cabeçalho fixo (título, subtítulo, Fechar), corpo rolável e rodapé opcional.

  Ao abrir, o foco vai para o título (o leitor de tela anuncia o assunto antes do
  conteúdo); ao fechar, volta para quem abriu (ou para `returnFocusRef`, se quem abriu
  sumiu da página; ver `useReturnFocus`). Para folha ligada à URL
  (`?categoria=`), `onOpenChange(false)` deve remover o parâmetro.
*/
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Para onde o foco vai ao fechar quando quem abriu não está mais na página. */
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onCloseAutoFocus = useReturnFocus(open, returnFocusRef)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-in fixed inset-0 z-50 bg-(--overlay) backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            titleRef.current?.focus()
          }}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'sheet-side-in fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-dialog',
            'inset-x-0 bottom-0 max-h-[92svh] rounded-t-sheet',
            'sm:inset-y-0 sm:right-0 sm:left-auto sm:h-svh sm:max-h-none sm:w-full sm:max-w-[26rem] sm:rounded-l-sheet sm:rounded-tr-none',
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <header className="flex shrink-0 items-start justify-between gap-4 px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <DialogPrimitive.Title
                ref={titleRef}
                tabIndex={-1}
                className="font-display text-title font-semibold tracking-tight focus-visible:outline-none"
              >
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-body-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="-mt-1 -mr-2 text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">{children}</div>
          {footer ? (
            <footer className="shrink-0 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
