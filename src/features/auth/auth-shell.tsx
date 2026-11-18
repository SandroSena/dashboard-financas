import { Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { cn } from '@/shared/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm', className)}>
      <Wallet className="size-4" aria-hidden="true" />
    </span>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <Link to="/entrar" className="flex items-center gap-3 text-lg font-semibold">
          <BrandMark className="bg-background text-foreground" />
          Finanças
        </Link>
        <div className="max-w-md">
          <p className="text-4xl font-semibold tracking-tight">O mês inteiro, em um só lugar.</p>
          <p className="mt-4 text-background/70">
            Lance onde o dinheiro foi, acompanhe o saldo e veja se cada categoria ainda cabe na meta.
          </p>
        </div>
        <p className="text-sm text-background/60">Cada conta vê apenas os próprios lançamentos.</p>
      </section>
      <section className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-lg font-semibold">Finanças</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </section>
    </div>
  )
}
