import { AuthProvider } from '@/features/auth/auth-context'
import { ConfigPage } from '@/features/auth/config-page'
import { AppRouter } from '@/app/router'
import { queryClient } from '@/shared/lib/query-client'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { ThemeProvider, useTheme } from '@/shared/theme/theme-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

export function App() {
  return (
    <ThemeProvider>
      {isSupabaseConfigured() ? (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppRouter />
            <AppToaster />
          </AuthProvider>
        </QueryClientProvider>
      ) : (
        <ConfigPage />
      )}
    </ThemeProvider>
  )
}

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} richColors closeButton position="top-center" />
}
