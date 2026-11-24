import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useReturnFocus } from '@/shared/ui/use-return-focus'
import type { ReactNode, RefObject } from 'react'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** Para onde o foco vai ao fechar quando quem abriu não está mais na página. */
  returnFocusRef?: RefObject<HTMLElement | null>
  /** `'ref'`: `returnFocusRef` vem antes de quem abriu (a tela escolhe o alvo). */
  returnFocusPriority?: 'opener' | 'ref'
}

/**
  Formulários e confirmações (design system 10.5). No celular abre como folha que sobe
  de baixo, com alça; a partir de 640px, centralizado (28rem). `Esc` e o véu fecham, e o
  foco volta para quem abriu (ou para `returnFocusRef`; ver `useReturnFocus`).
*/
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  returnFocusRef,
  returnFocusPriority,
}: DialogProps) {
  const onCloseAutoFocus = useReturnFocus(open, returnFocusRef, returnFocusPriority)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-in fixed inset-0 z-50 bg-(--overlay) backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'dialog-in fixed z-50 overflow-y-auto bg-popover text-popover-foreground shadow-dialog',
            'inset-x-0 bottom-0 max-h-[92svh] rounded-t-sheet px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
            'sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[calc(100svh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-md sm:rounded-sheet sm:p-6',
            className,
          )}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-title font-semibold tracking-tight">{title}</DialogPrimitive.Title>
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
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Confirmação de ação destrutiva. `pending` mostra "Excluindo..." e bloqueia os dois botões. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Excluindo...',
  pending = false,
  onConfirm,
  returnFocusRef,
  returnFocusPriority,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  pendingLabel?: string
  pending?: boolean
  onConfirm: () => void
  /** Para onde o foco vai ao fechar quando quem abriu sumiu (ex.: item de um popover). */
  returnFocusRef?: RefObject<HTMLElement | null>
  returnFocusPriority?: 'opener' | 'ref'
}) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      returnFocusRef={returnFocusRef}
      returnFocusPriority={returnFocusPriority}
    >
      <DialogActions>
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirm} loading={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </AppDialog>
  )
}

/** Botões do rodapé: empilhados e largos no celular (principal em cima), à direita no desktop. */
export function DialogActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}
