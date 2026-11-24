import { AppRouter } from '@/app/router'
import { AuthProvider } from '@/features/auth/auth-context'
import { ConfigPage } from '@/features/auth/config-page'
import { useMediaQuery } from '@/shared/hooks/use-prefers-reduced-motion'
import { queryClient } from '@/shared/lib/query-client'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { ThemeProvider, useTheme } from '@/shared/theme/theme-context'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Toaster } from 'sonner'

export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
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
      </TooltipProvider>
    </ThemeProvider>
  )
}

/**
  Toast (design system 10.13): `popover` + `shadow-overlay`, embaixo à direita no desktop;
  no celular, embaixo e acima da barra de navegação (88px).
*/
function AppToaster() {
  const { theme } = useTheme()
  const desktop = useMediaQuery('(min-width: 768px)')
  return (
    <Toaster
      theme={theme}
      closeButton
      position={desktop ? 'bottom-right' : 'bottom-center'}
      mobileOffset={{ bottom: 88 }}
      duration={4000}
      icons={{
        success: <CircleCheck className="size-4 text-income" aria-hidden="true" />,
        error: <CircleAlert className="size-4 text-expense" aria-hidden="true" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'rounded-control! border-0! bg-popover! text-popover-foreground! shadow-overlay! font-sans! text-body-sm!',
          description: 'text-muted-foreground!',
          closeButton: 'bg-popover! text-muted-foreground! border-border!',
        },
      }}
    />
  )
}
