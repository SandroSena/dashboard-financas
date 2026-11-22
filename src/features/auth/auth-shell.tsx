import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { cn } from '@/shared/lib/utils'

/** Duas moedas sobrepostas: o dinheiro da casa, contado a dois. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-primary', className)} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-[62%]">
        <circle cx="9.2" cy="12" r="5.6" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" />
        <circle cx="14.8" cy="12" r="5.6" fill="var(--primary-foreground)" fillOpacity="0.85" />
      </svg>
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
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-black p-12 text-[#eaf6f4] lg:flex lg:flex-col lg:justify-between">
        <Link to="/entrar" className="relative z-10 flex items-center gap-3 font-display text-xl font-semibold">
          <BrandMark className="bg-[#eaf6f4] [&_circle:first-child]:stroke-black [&_circle:last-child]:fill-black" />
          Finanças
        </Link>

        <div className="relative z-10 max-w-lg">
          <p className="font-display text-[3.4rem] text-balance leading-[1.02] font-semibold tracking-tight [font-variation-settings:'opsz'_96]">
            O mês da casa, num lugar só.
          </p>
          <p className="mt-5 max-w-md text-lg text-[#eaf6f4]/75">
            Anotem cada gasto, vejam o saldo andar e saibam quanto ainda cabe em cada categoria antes do mês acabar.
          </p>
        </div>

        <MonthRuler />
      </section>

      <section className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="font-display text-xl font-semibold">Finanças</span>
          </div>
          <h1 className="text-[2.25rem] leading-tight font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
        </div>
      </section>
    </div>
  )
}

/**
  Ilustração da ideia central do painel: a barra do mês. A parte cheia é o que já saiu
  da receita; a marca fina é o dia de hoje. Enquanto a barra fica atrás da marca, o mês está folgado.
*/
function MonthRuler() {
  return (
    <div className="relative z-10 max-w-lg" aria-hidden="true">
      <div className="flex items-baseline justify-between text-sm text-[#eaf6f4]/70">
        <span>Já saiu 54% da receita</span>
        <span>dia 19 de 30</span>
      </div>
      <div className="relative mt-3 h-4 rounded-full bg-[#eaf6f4]/12">
        <div className="fill-in absolute inset-y-0 left-0 w-[54%] rounded-full bg-[#22c55e]" />
        <div className="absolute -inset-y-1.5 left-[63%] w-0.5 rounded-full bg-[#eaf6f4]" />
      </div>
      <p className="mt-3 text-sm text-[#eaf6f4]/70">O gasto está atrás do calendário. Dá para respirar.</p>
    </div>
  )
}
