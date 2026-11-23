import { useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'
import { BrandLogo } from '@/shared/components/brand-mark'
import { ThemeToggle } from '@/shared/components/theme-toggle'

const README_URL = 'https://github.com/SandroSena/dashboard-financas#readme'

const code = 'rounded-chip bg-muted px-1.5 py-0.5 font-mono text-body-sm text-foreground break-all'

/**
  Sem Supabase configurado (login-cadastro.md, estado "Configuração ausente"): uma tela só,
  sem formulário, explicando o que falta. Sobre "Confirm email": desligar vale só para um
  projeto de teste, nunca para produção (auditoria de segurança, H-05).
*/
export function ConfigPage() {
  useEffect(() => {
    document.title = 'Falta conectar o banco | Finanças'
  }, [])

  const steps = [
    <>Criem um projeto no Supabase.</>,
    <>
      No SQL Editor, rodem os arquivos de <code className={code}>supabase/migrations</code>, em ordem de data.
    </>,
    <>Em Project Settings, copiem a URL do projeto e a chave anon (a pública; nunca a service_role).</>,
    <>
      Copiem <code className={code}>.env.example</code> para <code className={code}>.env</code> e preencham{' '}
      <code className={code}>VITE_SUPABASE_URL</code> e <code className={code}>VITE_SUPABASE_ANON_KEY</code>.
    </>,
    <>Reiniciem o servidor de desenvolvimento.</>,
  ]

  return (
    <main className="relative min-h-svh px-4 py-16 sm:px-6 sm:py-24">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-10">
          <BrandLogo />
        </div>
        <h1 className="text-heading font-semibold tracking-tight text-balance sm:text-display">Falta conectar o banco</h1>
        <p className="mt-3 text-body text-pretty text-muted-foreground">
          O app guarda lançamentos, categorias e metas num projeto do Supabase. Faltam as variáveis{' '}
          <code className={code}>VITE_SUPABASE_URL</code> e <code className={code}>VITE_SUPABASE_ANON_KEY</code>. A chave anon
          fica no navegador; quem isola os dados de cada conta são as políticas de segurança do banco.
        </p>

        <ol className="mt-10 grid">
          {steps.map((step, index) => (
            <li key={index} className="relative flex min-w-0 gap-4 pb-6 last:pb-0">
              {index < steps.length - 1 ? (
                <span className="absolute top-9 bottom-1 left-4 w-px bg-input" aria-hidden="true" />
              ) : null}
              <span
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-body-sm font-semibold text-brand"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0 pt-1 text-body break-words">{step}</span>
            </li>
          ))}
        </ol>

        <section aria-labelledby="confirmar-email" className="mt-10 flex gap-3 rounded-card bg-warning-soft p-4 sm:p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div className="grid min-w-0 gap-2 text-body-sm">
            <h2 id="confirmar-email" className="font-semibold text-foreground">
              Confirmação de e-mail
            </h2>
            <p className="text-muted-foreground">
              Com “Confirm email” ligado em Authentication, a conta só entra depois do clique no link. Para testar na hora,
              dá para desligar, <span className="font-semibold text-foreground">mas só num projeto de teste</span>.
            </p>
            <p className="text-muted-foreground">
              Em produção, deixem ligado: sem a confirmação, qualquer pessoa cria conta com o e-mail de outra.
            </p>
          </div>
        </section>

        <p className="mt-8 text-body-sm text-muted-foreground">
          O passo a passo completo está no{' '}
          <a href={README_URL} className="rounded-chip font-semibold text-brand underline-offset-4 hover:underline" rel="noreferrer" target="_blank">
            README do projeto
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
          .
        </p>
      </div>
    </main>
  )
}
