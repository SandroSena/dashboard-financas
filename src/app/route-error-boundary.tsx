import { claimChunkReload, isChunkLoadError } from '@/app/chunk-reload'
import { Button } from '@/shared/ui/button'
import { CircleAlert, RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useRouteError } from 'react-router'

function safeSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

/**
  Decisão de recarregar guardada por erro: o StrictMode renderiza duas vezes e a segunda
  chamada a `claimChunkReload` diria "já recarregou".
*/
const reloadDecisions = new WeakMap<object, boolean>()

function decideReload(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false
  const key = error as object
  const known = reloadDecisions.get(key)
  if (known !== undefined) return known
  const decision = claimChunkReload(safeSessionStorage(), Date.now())
  reloadDecisions.set(key, decision)
  return decision
}

/**
  `errorElement` das rotas (AC-06). Erro de carregamento de chunk → recarrega a página uma
  vez sozinho. Qualquer outro erro, ou o chunk falhando de novo → tela amigável em português,
  sem stack nem mensagem técnica, com "Recarregar" e "Ir para o painel".
*/
export function RouteErrorBoundary() {
  const error = useRouteError()
  const chunk = isChunkLoadError(error)
  const reloading = decideReload(error)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (reloading) {
      window.location.reload()
      return
    }
    if (import.meta.env.DEV) console.error(error)
    document.title = 'Erro | Finanças'
    headingRef.current?.focus()
  }, [error, reloading])

  if (reloading) {
    return (
      <div className="grid min-h-[50svh] place-items-center text-body-sm text-muted-foreground" role="status">
        Atualizando o app...
      </div>
    )
  }

  return (
    <div className="grid min-h-[60svh] place-items-center px-4 py-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <div
          className="mb-5 flex size-12 items-center justify-center rounded-full bg-expense-soft text-expense"
          aria-hidden="true"
        >
          {chunk ? <RefreshCw className="size-5" /> : <CircleAlert className="size-5" />}
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-heading font-semibold tracking-tight focus-visible:outline-none">
          {chunk ? 'Saiu uma versão nova do app' : 'Esta tela não abriu'}
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          {chunk
            ? 'Não deu para carregar esta parte do app. Recarreguem a página para usar a versão nova.'
            : 'Os lançamentos de vocês continuam salvos. Recarreguem a página; se o problema continuar, voltem para o painel.'}
        </p>
        <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" asChild>
            <Link to="/painel">Ir para o painel</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden="true" />
            Recarregar
          </Button>
        </div>
      </div>
    </div>
  )
}
