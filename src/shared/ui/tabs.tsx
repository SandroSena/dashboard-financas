import { cn } from '@/shared/lib/utils'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

/**
  Troca o conteúdo da área (design system 10.6). Para mudar um filtro ou valor,
  use `Segmented`.
*/
export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('grid gap-5', className)} {...props} />
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex w-fit items-center rounded-full bg-sunken p-1 text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-body-sm font-medium whitespace-nowrap pointer-coarse:h-11',
        'transition-[background-color,color,box-shadow] duration-(--duration-base) ease-standard hover:text-foreground',
        'disabled:cursor-not-allowed disabled:opacity-45',
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-edge',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}
