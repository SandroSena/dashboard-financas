import { describe, expect, it } from 'vitest'
import { CHUNK_RELOAD_KEY, CHUNK_RELOAD_WINDOW_MS, claimChunkReload, isChunkLoadError } from '@/app/chunk-reload'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  }
}

describe('AC-06: recarga automática quando um chunk some depois do deploy', () => {
  it('reconhece os erros de import dinâmico dos navegadores e do Vite', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://app/assets/transactions-page-abc.js',
      'error loading dynamically imported module: https://app/assets/x.js',
      'Importing a module script failed.',
      'Unable to preload CSS for /assets/index-abc.css',
    ]) {
      expect(isChunkLoadError(new TypeError(message))).toBe(true)
    }
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: '' })).toBe(true)
  })

  it('não confunde bug de render, resposta de rota ou valor qualquer com erro de chunk', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false)
    expect(isChunkLoadError({ status: 404, statusText: 'Not Found' })).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false)
  })

  it('recarrega uma vez e grava a marca na sessão', () => {
    const storage = memoryStorage()
    expect(claimChunkReload(storage, 1_000_000)).toBe(true)
    expect(storage.data.get(CHUNK_RELOAD_KEY)).toBe('1000000')
  })

  it('se falhar de novo logo depois da recarga, não recarrega outra vez (mostra a tela de erro)', () => {
    const storage = memoryStorage()
    expect(claimChunkReload(storage, 1_000_000)).toBe(true)
    expect(claimChunkReload(storage, 1_000_000 + 3_000)).toBe(false)
  })

  it('um deploy novo, bem depois, volta a poder recarregar sozinho', () => {
    const storage = memoryStorage({ [CHUNK_RELOAD_KEY]: '1000000' })
    expect(claimChunkReload(storage, 1_000_000 + CHUNK_RELOAD_WINDOW_MS + 1)).toBe(true)
  })

  it('sem sessionStorage, ou se ele falhar, não recarrega (evita laço)', () => {
    expect(claimChunkReload(undefined, 1)).toBe(false)
    const broken = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
    }
    expect(claimChunkReload(broken, 1)).toBe(false)
  })

  it('marca corrompida não bloqueia a recarga', () => {
    expect(claimChunkReload(memoryStorage({ [CHUNK_RELOAD_KEY]: 'abc' }), 5)).toBe(true)
  })
})
