import { cn } from '@/shared/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

/** Design system 10.1. Pílula; pressionado encolhe; desabilitado a 45%. */
const buttonVariants = cva(
  [
    'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none',
    'transition-[background-color,color,box-shadow,transform] duration-(--duration-fast) ease-standard',
    'active:scale-[0.97] active:duration-(--duration-instant)',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
    /* aria-disabled: continua focável (para a dica explicar o motivo), mas não age. */
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:active:scale-100',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        /** @deprecated use `primary` (nome antigo, mantido para as telas atuais). */
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'bg-transparent text-foreground inset-ring inset-ring-input hover:bg-accent',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'bg-transparent text-brand underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        /* 36px; em tela de toque, a área clicável cresce até 44px sem mudar o desenho. */
        sm: 'h-9 px-3.5 text-body-sm pointer-coarse:after:absolute pointer-coarse:after:-inset-1',
        md: 'h-10 px-5 text-body-sm',
        /** @deprecated use `md`. */
        default: 'h-10 px-5 text-body-sm',
        lg: 'h-12 px-6 text-body',
        icon: 'size-10 pointer-coarse:size-11',
        'icon-sm': 'size-9 pointer-coarse:size-11',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-1' }],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /**
      Mostra o spinner e desabilita. O texto quem passa é a tela, no gerúndio
      ("Salvando..."). A largura não muda porque o spinner entra no lugar do ícone.
    */
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}
