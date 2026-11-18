import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/shared/theme/theme-context'
import { Button } from '@/shared/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
