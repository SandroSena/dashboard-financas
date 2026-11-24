import type { Category } from '@/domain/types'
import { CategoryDot } from '@/shared/components/category-avatar'
import { nextRadioIndex } from '@/shared/lib/roving'
import { cn } from '@/shared/lib/utils'
import { Check } from 'lucide-react'
import { useRef, type Ref } from 'react'

/**
  Categoria como chips (até 8 do tipo): `role="radiogroup"` com foco itinerante; as setas
  movem e marcam, Tab sai do grupo. A cor vem sempre com o nome escrito (spec 7).
*/
export function CategoryChips({
  categories,
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid,
  focusRef,
}: {
  categories: readonly Category[]
  value: string
  onChange: (id: string) => void
  labelledBy: string
  describedBy?: string
  invalid?: boolean
  /** Recebe o chip que fica no Tab (o marcado, ou o primeiro): o formulário foca aqui no erro. */
  focusRef?: Ref<HTMLButtonElement>
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = categories.findIndex((category) => category.id === value)
  const tabIndexOwner = selectedIndex >= 0 ? selectedIndex : 0

  function move(index: number) {
    const category = categories[index]
    if (!category) return
    onChange(category.id)
    buttons.current[index]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-2"
    >
      {categories.map((category, index) => {
        const checked = category.id === value
        const isOwner = index === tabIndexOwner
        return (
          <button
            key={category.id}
            ref={(element) => {
              buttons.current[index] = element
              if (isOwner && focusRef) {
                if (typeof focusRef === 'function') focusRef(element)
                else focusRef.current = element
              }
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={isOwner ? 0 : -1}
            onClick={() => onChange(category.id)}
            onKeyDown={(event) => {
              const target = nextRadioIndex(index, event.key, categories.length)
              if (target === null) return
              event.preventDefault()
              move(target)
            }}
            className={cn(
              'inline-flex h-10 max-w-full cursor-pointer items-center gap-2 rounded-full px-3.5 text-body-sm font-medium pointer-coarse:h-11',
              'transition-[background-color,box-shadow,color] duration-(--duration-fast) ease-standard',
              checked
                ? 'bg-brand-soft text-foreground inset-ring-2 inset-ring-brand'
                : 'text-muted-foreground inset-ring inset-ring-input hover:bg-accent hover:text-foreground',
              invalid && !checked && 'inset-ring-destructive',
            )}
          >
            <CategoryDot color={category.color} />
            <span className="truncate">{category.name}</span>
            {checked ? <Check className="size-3.5 shrink-0 text-brand" strokeWidth={3} aria-hidden="true" /> : null}
          </button>
        )
      })}
    </div>
  )
}
