/**
  Visual comum de campo e select (design system 10.4): 48px no celular, 44px no desktop,
  `rounded-control`, fundo `card`, borda `input`; foco com borda `ring` + halo `brand-soft`;
  inválido com borda `destructive`.
*/
export const controlClass = [
  'h-12 w-full rounded-control border border-input bg-card px-3.5 text-body text-foreground sm:h-11',
  'transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard',
  'placeholder:text-muted-foreground hover:border-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-brand-soft focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-destructive',
].join(' ')
