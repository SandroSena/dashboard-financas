/**
  Depois de um deploy, uma aba aberta pede um chunk com hash antigo, que não existe mais,
  e o `import()` da página falha (auditoria R-01). A saída é recarregar a página UMA vez,
  para pegar o `index.html` novo. Se falhar de novo logo em seguida, mostramos a tela de erro
  em vez de entrar num laço de recargas.
*/

export const CHUNK_RELOAD_KEY = 'financas:chunk-reload-at'

/** Janela em que uma segunda falha conta como "a recarga não resolveu". */
export const CHUNK_RELOAD_WINDOW_MS = 15_000

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i, // Chrome, Edge
  /error loading dynamically imported module/i, // Firefox
  /importing a module script failed/i, // Safari
  /unable to preload css/i, // Vite (CSS do chunk)
  /failed to load module script/i,
  /loading (css )?chunk [\w-]+ failed/i,
]

/** O erro é de carregamento de código (chunk/CSS dinâmico), e não um bug de render? */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const { name, message } = error as { name?: unknown; message?: unknown }
  if (name === 'ChunkLoadError') return true
  return typeof message === 'string' && CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/**
  Pode recarregar sozinho agora? Só se não houve outra recarga automática nesta aba
  nos últimos `CHUNK_RELOAD_WINDOW_MS`. Se pode, grava a marca (com o horário) antes de recarregar.
  Sem `sessionStorage` (modo privado restrito), não recarrega: melhor a tela de erro que um laço.
*/
export function claimChunkReload(storage: StorageLike | undefined, now: number): boolean {
  if (!storage) return false
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_KEY))
    if (Number.isFinite(last) && last > 0 && now - last < CHUNK_RELOAD_WINDOW_MS) return false
    storage.setItem(CHUNK_RELOAD_KEY, String(now))
    return true
  } catch {
    return false
  }
}
