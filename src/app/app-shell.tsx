import { BrandMark } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { QuickAddProvider, useQuickAdd } from '@/features/lancamentos/quick-add'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { LayoutDashboard, LogOut, Plus, Receipt, Tags, Target, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'

type ShellItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const links: ShellItem[] = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', icon: Receipt },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/categorias', label: 'Categorias', icon: Tags },
]

const panelVariants = [
  { to: '/painel', label: 'Resumo', end: true },
  { to: '/painel/comando', label: 'Comando' },
  { to: '/painel/fluxo', label: 'Fluxo' },
  { to: '/painel/atlas', label: 'Atlas' },
]

export function AppShell() {
  return (
    <QuickAddProvider>
      <ShellLayout />
    </QuickAddProvider>
  )
}

function ShellLayout() {
  const { month } = useMonthParam()
  const { user, signOut } = useAuth()
  const quickAdd = useQuickAdd()
  const { pathname } = useLocation()
  const roomy = pathname.startsWith('/painel/')
  const onPanel = pathname.startsWith('/painel')

  async function onSignOut() {
    try {
      await signOut()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[248px_1fr]">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-svh md:flex-col md:px-4 md:py-6">
        <div className="flex items-center gap-2.5 px-2">
          <BrandMark />
          <span className="font-display text-xl font-semibold tracking-tight">Finanças</span>
        </div>

        <Button className="mt-8 h-11 w-full" disabled={!quickAdd.ready} onClick={quickAdd.open}>
          <Plus className="size-4" />
          Novo lançamento
        </Button>

        <nav className="mt-6 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto" aria-label="Principal">
          {links.map((link) => (
            <div key={link.to}>
              <SideLink {...link} month={month} />
              {link.to === '/painel' && onPanel ? (
                <div className="mt-0.5 mb-1 ml-[1.375rem] grid gap-0.5 border-l border-input pl-3">
                  {panelVariants.map((variant) => (
                    <NavLink
                      key={variant.to}
                      to={`${variant.to}?mes=${month}`}
                      end={variant.end}
                      className={({ isActive }) =>
                        cn(
                          'rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground',
                          isActive && 'font-semibold text-foreground',
                        )
                      }
                    >
                      {variant.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-card p-2 pl-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand"
            aria-hidden="true"
          >
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={user?.email ?? undefined}>
            {user?.email}
          </p>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="size-9" aria-label="Sair" onClick={() => void onSignOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <BrandMark className="size-8" />
            <span className="font-display text-lg font-semibold tracking-tight">Finanças</span>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => void onSignOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-14">
          <div key={pathname} className={cn('page-in mx-auto w-full', roomy ? 'max-w-[1400px]' : 'max-w-6xl')}>
            <Outlet />
          </div>
        </main>

        <nav
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 items-center rounded-2xl bg-card/95 p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)] backdrop-blur-md md:hidden"
          aria-label="Principal"
        >
          {links.slice(0, 2).map((link) => (
            <TabLink key={link.to} {...link} month={month} />
          ))}
          <button
            type="button"
            aria-label="Novo lançamento"
            disabled={!quickAdd.ready}
            onClick={quickAdd.open}
            className="mx-auto flex size-12 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-6px_var(--brand)] transition-transform duration-200 active:scale-90 disabled:opacity-45"
          >
            <Plus className="size-5" />
          </button>
          {links.slice(2).map((link) => (
            <TabLink key={link.to} {...link} month={month} />
          ))}
        </nav>
      </div>
    </div>
  )
}

function SideLink({ to, label, icon: Icon, month }: ShellItem & { month: string }) {
  return (
    <NavLink
      to={`${to}?mes=${month}`}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-full px-3 py-2.5 text-[15px] font-medium text-muted-foreground transition-[background-color,color] duration-200 hover:bg-card/60 hover:text-foreground',
          isActive && 'bg-card text-foreground hover:bg-card',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[18px] transition-colors', isActive && 'text-brand')} aria-hidden="true" />
          {label}
        </>
      )}
    </NavLink>
  )
}

function TabLink({ to, label, icon: Icon, month }: ShellItem & { month: string }) {
  return (
    <NavLink
      to={`${to}?mes=${month}`}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground transition-colors',
          isActive && 'text-brand',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-[background-color] duration-300 ease-fluid',
              isActive && 'bg-brand-soft',
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
