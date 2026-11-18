import { useAuth } from '@/features/auth/auth-context'
import { AppShell } from '@/app/app-shell'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'

const LoginPage = lazy(() => import('@/features/auth/login-page').then((module) => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/signup-page').then((module) => ({ default: module.SignupPage })))
const CategoriesPage = lazy(() =>
  import('@/features/categorias/categories-page').then((module) => ({ default: module.CategoriesPage })),
)
const TransactionsPage = lazy(() =>
  import('@/features/lancamentos/transactions-page').then((module) => ({ default: module.TransactionsPage })),
)
const BudgetsPage = lazy(() =>
  import('@/features/orcamentos/budgets-page').then((module) => ({ default: module.BudgetsPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/painel/dashboard-page').then((module) => ({ default: module.DashboardPage })),
)
const ComandoPage = lazy(() =>
  import('@/features/painel/layouts/comando-page').then((module) => ({ default: module.ComandoPage })),
)
const FluxoPage = lazy(() =>
  import('@/features/painel/layouts/fluxo-page').then((module) => ({ default: module.FluxoPage })),
)
const AtlasPage = lazy(() =>
  import('@/features/painel/layouts/atlas-page').then((module) => ({ default: module.AtlasPage })),
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<ScreenLoading />}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/criar-conta" element={<SignupPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/painel" element={<DashboardPage />} />
              <Route path="/painel/comando" element={<ComandoPage />} />
              <Route path="/painel/fluxo" element={<FluxoPage />} />
              <Route path="/painel/atlas" element={<AtlasPage />} />
              <Route path="/lancamentos" element={<TransactionsPage />} />
              <Route path="/orcamentos" element={<BudgetsPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function ScreenLoading() {
  return (
    <div className="grid min-h-svh place-items-center text-sm text-muted-foreground" role="status">
      Carregando sua conta...
    </div>
  )
}

function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <ScreenLoading />
  if (user) return <Navigate to="/painel" replace />
  return <Outlet />
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <ScreenLoading />
  if (!user) return <Navigate to="/entrar" replace />
  return <Outlet />
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <ScreenLoading />
  return <Navigate to={user ? '/painel' : '/entrar'} replace />
}
