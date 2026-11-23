import { useAuth } from '@/features/auth/auth-context'
import { QuickAddProvider, useQuickAdd } from '@/features/lancamentos/quick-add'
import { BrandLogo } from '@/shared/components/brand-mark'
import { LoadingBlock } from '@/shared/components/feedback'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { useMonthParam } from '@/shared/hooks/use-month-param'
import { hasOpenDialog, matchesShortcut } from '@/shared/lib/keyboard'
import { errorMessage } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Tooltip } from '@/shared/ui/tooltip'
import { LayoutDashboard, LoaderCircle, LogOut, Plus, Receipt, Tags, Target, type LucideIcon } from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'

type ShellItem = { to: string; label: string; icon: LucideIcon }

const links: ShellItem[] = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', icon: Receipt },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/categorias', label: 'Categorias', icon: Tags },
]

const LOADING_CATEGORIES = 'Carregando categorias...'

export function AppShell() {
  return (
    <QuickAddProvider>
      <ShellLayout />
    </QuickAddProvider>
  )
}

/** Shell e navegação: docs/design/telas/shell-navegacao.md. */
function ShellLayout() {
  const { month } = useMonthParam()
  const { user, signOut } = useAuth()
  const quickAdd = useQuickAdd()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const [signingOut, setSigningOut] = useState(false)
  const wide = pathname.startsWith('/painel')
  const scrolled = useScrolledPast(8)

  // Troca de rota pelo menu: o foco vai para o conteúdo novo (AC-23). Não na primeira carga.
  const firstPath = useRef(pathname)
  useEffect(() => {
    if (pathname === firstPath.current) return
    firstPath.current = ''
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  // Atalho N: novo lançamento, fora de campos e de diálogos (UX-02, UX-03).
  const quickAddRef = useRef(quickAdd)
  useEffect(() => {
    quickAddRef.current = quickAdd
  })
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!matchesShortcut(event, 'n') || hasOpenDialog(document)) return
      if (!quickAddRef.current.ready) return
      event.preventDefault()
      quickAddRef.current.open()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  async function onSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      toast.error(`Não foi possível sair. ${errorMessage(error)}`)
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[248px_1fr]">
      <a
        href="#conteudo"
        className="skip-link inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-body-sm font-semibold text-primary-foreground shadow-overlay"
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Pular para o conteúdo
      </a>

      <aside className="hidden md:sticky md:top-0 md:flex md:h-svh md:flex-col md:px-4 md:py-6">
        <NavLink to={`/painel?mes=${month}`} className="flex w-fit items-center rounded-control px-2 py-1" aria-label="Finanças, ir para o painel">
          <BrandLogo />
        </NavLink>

        <QuickAddButton className="mt-8" />

        <nav className="mt-6 grid min-h-0 flex-1 content-start gap-1 overflow-y-auto" aria-label="Principal">
          {links.map((link) => (
            <SideLink key={link.to} {...link} month={month} />
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-1 rounded-control bg-card p-2 pl-3 shadow-edge">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-body-sm font-semibold text-brand"
            aria-hidden="true"
          >
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </span>
          <p className="ml-1 min-w-0 flex-1 truncate text-caption text-muted-foreground" title={user?.email ?? undefined}>
            {user?.email}
          </p>
          <ThemeToggle />
          <SignOutButton busy={signingOut} onClick={() => void onSignOut()} />
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col">
        <header
          className={cn(
            'sticky top-0 z-20 flex h-14 items-center justify-between bg-background/80 px-4 backdrop-blur-md transition-[border-color] duration-(--duration-fast) md:hidden',
            'border-b',
            scrolled ? 'border-border' : 'border-transparent',
          )}
        >
          <NavLink to={`/painel?mes=${month}`} className="flex items-center rounded-control" aria-label="Finanças, ir para o painel">
            <BrandLogo markClassName="size-8" />
          </NavLink>
          <div className="flex items-center">
            <ThemeToggle />
            <SignOutButton busy={signingOut} onClick={() => void onSignOut()} />
          </div>
        </header>

        <main
          id="conteudo"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 px-4 pt-4 pb-28 outline-none sm:px-6 md:px-10 md:pt-10 md:pb-14"
        >
          <div key={pathname} className={cn('page-in mx-auto w-full', wide ? 'max-w-wide' : 'max-w-6xl')}>
            <Suspense fallback={<LoadingBlock label="Carregando a página" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        <nav
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center rounded-card bg-card/95 p-1.5 shadow-raised backdrop-blur-md md:hidden"
          aria-label="Principal"
        >
          {links.slice(0, 2).map((link) => (
            <TabLink key={link.to} {...link} month={month} />
          ))}
          <QuickAddFab />
          {links.slice(2).map((link) => (
            <TabLink key={link.to} {...link} month={month} />
          ))}
        </nav>
      </div>
    </div>
  )
}

/** Fio embaixo do cabeçalho do celular depois de rolar `offset` px. */
function useScrolledPast(offset: number): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > offset)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [offset])
  return scrolled
}

function QuickAddButton({ className }: { className?: string }) {
  const quickAdd = useQuickAdd()
  const button = (
    <Button
      size="lg"
      className={cn('w-full justify-between', className)}
      aria-disabled={quickAdd.loading || undefined}
      aria-keyshortcuts="n"
      onClick={quickAdd.open}
    >
      <span className="flex items-center gap-2">
        <Plus aria-hidden="true" />
        Novo lançamento
      </span>
      <kbd
        className="rounded-chip bg-primary-foreground/15 px-1.5 font-sans text-caption font-semibold"
        aria-hidden="true"
      >
        N
      </kbd>
    </Button>
  )
  return quickAdd.loading ? <Tooltip content={LOADING_CATEGORIES}>{button}</Tooltip> : button
}

function QuickAddFab() {
  const quickAdd = useQuickAdd()
  return (
    <button
      type="button"
      aria-label={quickAdd.loading ? `Novo lançamento (${LOADING_CATEGORIES})` : 'Novo lançamento'}
      aria-disabled={quickAdd.loading || undefined}
      onClick={quickAdd.open}
      className={cn(
        'mx-1 flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised',
        'transition-[background-color,transform] duration-(--duration-fast) ease-standard hover:bg-primary-hover active:scale-90 active:duration-(--duration-instant)',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-45',
      )}
    >
      <Plus className="size-6" aria-hidden="true" />
    </button>
  )
}

function SignOutButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Tooltip content="Sair">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sair"
        aria-busy={busy || undefined}
        aria-disabled={busy || undefined}
        onClick={onClick}
      >
        {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
      </Button>
    </Tooltip>
  )
}

function SideLink({ to, label, icon: Icon, month }: ShellItem & { month: string }) {
  return (
    <NavLink
      to={`${to}?mes=${month}`}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-control px-3 text-body font-medium text-muted-foreground',
          'transition-[background-color,color,transform] duration-(--duration-fast) ease-standard hover:bg-card/60 hover:text-foreground active:scale-[0.97]',
          isActive && 'bg-card text-foreground shadow-edge hover:bg-card',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[18px] shrink-0', isActive && 'text-brand')} aria-hidden="true" />
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
          // `flex-auto`: cada item parte da largura do próprio rótulo, e "Lançamentos" cabe inteiro a 375px.
          'flex min-h-12 min-w-0 flex-auto flex-col items-center justify-center gap-1 rounded-control px-0.5 py-1 text-caption font-medium text-muted-foreground',
          'transition-[color,transform] duration-(--duration-fast) ease-standard active:scale-[0.97]',
          isActive && 'text-brand',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-[background-color] duration-(--duration-base) ease-fluid',
              isActive && 'bg-brand-soft',
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}
