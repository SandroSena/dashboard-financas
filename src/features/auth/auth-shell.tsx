import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BrandLogo } from '@/shared/components/brand-mark'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { cn } from '@/shared/lib/utils'

const PITCH = 'O mês da casa, num lugar só.'
const SUPPORT =
  'Anotem cada gasto, vejam o saldo andar e saibam quanto ainda cabe em cada categoria antes do mês acabar.'

/**
  Moldura de entrar/criar conta (docs/design/telas/login-cadastro.md, UX-90..UX-98).
  Desktop (≥ 1024px): painel da esquerda sempre escuro (a classe `dark` troca os tokens só
  ali dentro) com a régua ilustrativa; formulário à direita. Celular/tablet: só o formulário,
  com a régua compacta embaixo.
*/
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="dark relative hidden overflow-hidden bg-background p-12 text-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/entrar" className="w-fit rounded-control" aria-label="Finanças">
          <BrandLogo />
        </Link>

        <div className="max-w-lg">
          <p className="font-display text-display font-semibold tracking-tight text-balance [font-variation-settings:'opsz'_96]">
            {PITCH}
          </p>
          <p className="mt-5 max-w-md text-lead text-pretty text-muted-foreground">{SUPPORT}</p>
        </div>

        <MonthRuler />
      </section>

      <main className="relative flex flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandLogo />
          </div>
          <h1 className="text-heading font-semibold tracking-tight text-balance sm:text-display">{title}</h1>
          <div className="mt-2 text-body text-pretty text-muted-foreground">{subtitle}</div>
          <div className="mt-8">{children}</div>
          {footer ? <p className="mt-8 text-body-sm text-muted-foreground">{footer}</p> : null}
          <CompactRuler />
        </div>
      </main>
    </div>
  )
}

/**
  A régua do mês, como ilustração da ideia do painel: a parte cheia é o que já saiu da
  receita (54%); a marca fina é hoje (Dia 19 de 30, 63%). Enche uma vez (`fill-in`), a marca
  e a frase entram depois. Com movimento reduzido, o CSS zera durações e atrasos: aparece
  pronta (UX-91). Decorativa (`aria-hidden`).
*/
function MonthRuler() {
  return (
    <div className="max-w-lg" aria-hidden="true">
      <div className="flex items-baseline justify-between text-body-sm text-muted-foreground">
        <span>Já saiu 54% da receita</span>
        <span className="figure">Dia 19 de 30</span>
      </div>
      <div className="relative mt-3 h-4 rounded-full bg-track">
        <div className="absolute inset-y-0 left-0 w-[54%] overflow-hidden rounded-full">
          <div className="fill-in h-full w-full rounded-full bg-primary" />
        </div>
        <div className="page-in absolute -inset-y-1.5 left-[63%] w-0.5 rounded-full bg-foreground" style={{ animationDelay: 'var(--duration-hero)' }} />
      </div>
      <p className="page-in mt-3 text-body-sm text-muted-foreground" style={{ animationDelay: 'var(--duration-hero)' }}>
        O gasto está atrás do calendário. Dá para respirar.
      </p>
    </div>
  )
}

/** Celular/tablet: régua de 10px, sem texto animado, com a frase do produto. */
function CompactRuler({ className }: { className?: string }) {
  return (
    <div className={cn('mt-12 lg:hidden', className)}>
      <div className="relative h-2.5 rounded-full bg-track" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 w-[54%] rounded-full bg-primary" />
        <div className="absolute -inset-y-1 left-[63%] w-0.5 rounded-full bg-foreground" />
      </div>
      <p className="mt-3 text-body-sm text-muted-foreground">{PITCH}</p>
    </div>
  )
}
