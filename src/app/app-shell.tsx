import { BrandMark } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Activity, Gauge, LayoutDashboard, LogOut, Map, Receipt, Tags, Target, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'

type ShellItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const panelLinks: ShellItem[] = [
  { to: '/painel', label: 'Atual', icon: LayoutDashboard, end: true },
  { to: '/painel/comando', label: 'Comando', icon: Gauge },
  { to: '/painel/fluxo', label: 'Fluxo', icon: Activity },
  { to: '/painel/atlas', label: 'Atlas', icon: Map },
]

const links: ShellItem[] = [
  { to: '/lancamentos', label: 'Lançamentos', icon: Receipt },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/categorias', label: 'Categorias', icon: Tags },
]

const mobileLinks: ShellItem[] = [{ to: '/painel', label: 'Painel', icon: LayoutDashboard }, ...links]

export function AppShell() {
  const { month } = useMonthParam()
  const { user, signOut } = useAuth()
  const roomy = useLocation().pathname.startsWith('/painel/')

  async function onSignOut() {
    try {
      await signOut()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="min-h-svh bg-muted/40 md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-6">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">Finanças</span>
        </div>
        <nav className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-3">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Painel</p>
          {panelLinks.map((link) => (
            <ShellLink key={link.to} {...link} month={month} />
          ))}
          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Gestão</p>
          {links.map((link) => (
            <ShellLink key={link.to} {...link} month={month} />
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t p-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand uppercase" aria-hidden="true">
            {user?.email?.charAt(0) ?? "?"}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user?.email}</p>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => void onSignOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-semibold">Finanças</span>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => void onSignOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">
          <div className={cn('mx-auto w-full', roomy ? 'max-w-[1400px]' : 'max-w-6xl')}>
            <Outlet />
          </div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {mobileLinks.map((link) => (
            <ShellLink key={link.to} {...link} month={month} compact />
          ))}
        </nav>
      </div>
    </div>
  )
}

function ShellLink({
  to,
  label,
  icon: Icon,
  month,
  end = false,
  compact = false,
}: ShellItem & {
  month: string
  compact?: boolean
}) {
  return (
    <NavLink
      to={`${to}?mes=${month}`}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          compact && 'flex-col gap-1 px-1 py-2 text-[11px]',
          isActive && 'bg-brand/10 font-medium text-brand hover:bg-brand/15 hover:text-brand',
          isActive && compact && 'bg-transparent hover:bg-transparent',
        )
      }
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </NavLink>
  )
}
