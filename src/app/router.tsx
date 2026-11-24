import { AppShell } from '@/app/app-shell'
import { RouteErrorBoundary } from '@/app/route-error-boundary'
import { useAuth } from '@/features/auth/auth-context'
import { redirectTarget } from '@/features/auth/auth-errors'
import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  useLocation,
} from 'react-router'

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

/*
  Data router: só ele aceita `errorElement` (AC-06). Os erros das páginas do app aparecem
  dentro do shell (o menu continua usável); os de login/cadastro e do próprio shell, na raiz.
*/
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<RouteErrorBoundary />}>
      <Route element={<GuestRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/criar-conta" element={<SignupPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route errorElement={<RouteErrorBoundary />}>
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/lancamentos" element={<TransactionsPage />} />
            <Route path="/orcamentos" element={<BudgetsPage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Route>,
  ),
)

export function AppRouter() {
  return <RouterProvider router={router} />
}

function RootLayout() {
  return (
    <Suspense fallback={<ScreenLoading />}>
      <Outlet />
    </Suspense>
  )
}

function ScreenLoading() {
  return (
    <div className="grid min-h-svh place-items-center text-body-sm text-muted-foreground" role="status">
      Carregando sua conta...
    </div>
  )
}

function GuestRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <ScreenLoading />
  // Entrou: volta para o link protegido que abriu, se houver (UX-94).
  if (user) return <Navigate to={redirectTarget(location.state)} replace />
  return <Outlet />
}

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <ScreenLoading />
  if (!user) return <Navigate to="/entrar" replace state={{ from: `${location.pathname}${location.search}` }} />
  return <Outlet />
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <ScreenLoading />
  return <Navigate to={user ? '/painel' : '/entrar'} replace />
}
