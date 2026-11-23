import { errorReason } from '@/shared/lib/error-copy'
import { errorMessage } from '@/shared/lib/supabase'
import { toast, type ExternalToast } from 'sonner'

/**
  Toast de erro de uma ação, com o contexto no título e o motivo embaixo
  ("Não foi possível excluir o lançamento." / "Sua sessão expirou..."). O formulário ou a
  linha continuam como estavam; quem chama decide se oferece "Tentar de novo".
*/
export function toastActionError(title: string, error: unknown, options: ExternalToast = {}) {
  return toast.error(title, {
    duration: 6000,
    ...options,
    description: errorReason(title, errorMessage(error)),
  })
}

/**
  Link com uma categoria que não existe mais (painel UX-30, lançamentos UX-51): o mesmo
  aviso, do mesmo tipo, nas duas telas.
*/
export function toastMissingCategory() {
  return toast.error('Essa categoria não existe mais.', { duration: 6000 })
}
