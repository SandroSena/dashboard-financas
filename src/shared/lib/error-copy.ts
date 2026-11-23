import type { DataErrorCode } from '@/shared/lib/supabase'

/**
  Textos de erro montados a partir da mensagem do repository (já em português e segura,
  ver `errorMessage`). Funções puras, para não repetir frases nem orientar duas vezes.
*/

function normalize(text: string): string {
  return text.trim().replace(/[.!\s]+$/u, '').toLowerCase()
}

/**
  Motivo do toast de erro de uma ação ("Não foi possível excluir o lançamento." + motivo).
  Quando o repository caiu no texto genérico igual ao título, o motivo some.
*/
export function errorReason(title: string, message: string): string | undefined {
  const reason = message.trim()
  if (!reason || normalize(reason) === normalize(title)) return undefined
  return reason
}

/** Códigos de `DataError` cuja mensagem já diz o que fazer (rede, sessão, permissão). */
const GUIDED_CODES: ReadonlySet<DataErrorCode> = new Set<DataErrorCode>(['network', 'auth', 'permission'])

/** A mensagem já orienta a pessoa ("tentem de novo", "Confiram...", "Entrem novamente")? */
function alreadyGuides(message: string): boolean {
  return /\b(tent[ea]m?|confir[ae]m?|verifi(que|quem)|entr[ea]m?)\b/iu.test(message)
}

/**
  Mensagem do erro de carga de uma tela. Só acrescenta a orientação (`hint`) quando a
  mensagem ainda não orienta: pelo `code` do `DataError` e, sem código, pelo texto.
*/
export function loadErrorText(message: string, hint: string, code?: DataErrorCode): string {
  const text = message.trim()
  if (!text) return hint
  if ((code && GUIDED_CODES.has(code)) || alreadyGuides(text)) return text
  return `${text} ${hint}`
}
