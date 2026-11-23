import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
  O tailwind-merge precisa conhecer os tokens próprios de `src/index.css`; sem isso ele
  confunde `text-body-sm` (tamanho) com `text-foreground` (cor) e descarta um dos dois.
*/
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'label', 'body-sm', 'body', 'lead', 'title-sm', 'title', 'heading', 'display', 'hero'],
      shadow: ['edge', 'raised', 'overlay', 'dialog'],
      radius: ['chip', 'control', 'card', 'sheet'],
      ease: ['standard', 'fluid', 'exit'],
      container: ['wide'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
