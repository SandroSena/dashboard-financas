import { useTheme } from '@/shared/theme/theme-context'
import { Button } from '@/shared/ui/button'
import { Tooltip } from '@/shared/ui/tooltip'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'

  return (
    <Tooltip content={label}>
      <Button variant="ghost" size="icon" className={className} aria-label={label} onClick={toggleTheme}>
        {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </Button>
    </Tooltip>
  )
}
