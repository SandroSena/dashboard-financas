import type { CompareMode } from '@/features/painel/params'
import { MonthSwitcher } from '@/shared/components/month-switcher'
import { Segmented } from '@/shared/ui/segmented'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

const COMPARE_OPTIONS = [
  { value: 'anterior', label: 'Mês anterior' },
  { value: 'media', label: 'Média de 3 meses' },
] as const

function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
  Cabeçalho do painel (spec 4.1): saudação (parágrafo; o `h1` é o destaque do mês), data,
  seletor de mês e "Comparar com". Fica fora do conteúdo: funciona carregando e com erro.
*/
export function DashboardHeader({
  compare,
  onCompareChange,
  onPrefetch,
  spendByMonth,
}: {
  compare: CompareMode
  onCompareChange: (next: CompareMode) => void
  onPrefetch: (month: string) => void
  spendByMonth?: Readonly<Record<string, number>>
}) {
  const [now] = useState(() => new Date())
  return (
    <header className="grid gap-4 lg:flex lg:flex-wrap lg:items-end lg:justify-between">
      <div>
        <p className="font-display text-title font-semibold tracking-tight">{greeting(now)}</p>
        <p className="mt-0.5 text-body-sm text-muted-foreground first-letter:uppercase">
          {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <MonthSwitcher onPrefetch={onPrefetch} spendByMonth={spendByMonth} />
        <div className="grid gap-1.5 sm:flex sm:items-center sm:gap-2">
          <span className="text-label text-muted-foreground" aria-hidden="true">
            Comparar com
          </span>
          <Segmented
            label="Comparar com"
            size="sm"
            className="w-full sm:w-auto"
            value={compare}
            onChange={onCompareChange}
            options={COMPARE_OPTIONS}
          />
        </div>
      </div>
    </header>
  )
}
