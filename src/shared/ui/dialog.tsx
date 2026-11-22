import { cn } from '@/shared/lib/utils'
import * as Dialog from '@radix-ui/react-dialog'
import { Eye, EyeOff, X } from 'lucide-react'
import { type ComponentProps, type ReactNode, useState } from 'react'
import { Button } from '@/shared/ui/button'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

/** No celular abre como folha que sobe de baixo; a partir de 640px, centralizado. */
export function AppDialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-in fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'dialog-in fixed z-50 overflow-y-auto bg-popover text-popover-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]',
            'inset-x-0 bottom-0 max-h-[92svh] rounded-t-2xl px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
            'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100svh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-7',
          )}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold tracking-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mt-1 -mr-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <DialogActions>
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={pending}>
          {pending ? 'Excluindo...' : confirmLabel}
        </Button>
      </DialogActions>
    </AppDialog>
  )
}

/** Botões do rodapé: empilhados e largos no celular, à direita no desktop. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{children}</div>
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlClass =
  'h-11 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] text-foreground transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground/50 focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_var(--brand-soft)] focus-visible:outline-none disabled:opacity-50 aria-[invalid=true]:border-destructive'

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cn(controlClass, 'pr-12', className)} {...props} />
      <button
        type="button"
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        controlClass,
        'cursor-pointer appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-10',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    />
  )
}

/** Escolha entre duas ou três opções, com o mesmo visual em todo o app. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string; tone?: 'income' | 'expense' }>
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-full bg-muted p-1', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 flex-1 cursor-pointer rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-200 ease-fluid hover:text-foreground',
              active && 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12)]',
              active && option.tone === 'income' && 'text-income',
              active && option.tone === 'expense' && 'text-expense',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
