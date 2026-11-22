import { ThemeToggle } from '@/shared/components/theme-toggle'
import { BrandMark } from '@/features/auth/auth-shell'

const steps = [
  'Crie um projeto no Supabase.',
  'Abra o SQL Editor e rode os arquivos de supabase/migrations, em ordem de data.',
  'Em Project Settings, copie a URL do projeto e a chave anon.',
  'Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  'Reinicie o servidor de desenvolvimento.',
]

export function ConfigPage() {
  return (
    <main className="relative min-h-svh px-6 py-16 sm:py-24">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-10 flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-xl font-semibold">Finanças</span>
        </div>
        <h1 className="text-[2.25rem] leading-tight font-semibold tracking-tight">Conecte o Supabase para começar</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          O painel guarda lançamentos, categorias e metas no seu projeto. A chave anon fica no navegador; quem isola os
          dados de cada conta é a política de segurança do banco.
        </p>
        <ol className="mt-10 grid gap-0">
          {steps.map((step, index) => (
            <li key={step} className="relative flex min-w-0 gap-4 pb-6 last:pb-0">
              {index < steps.length - 1 ? (
                <span className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-input" aria-hidden="true" />
              ) : null}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand">
                {index + 1}
              </span>
              <span className="min-w-0 pt-1 text-[15px] break-words">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-10 rounded-xl bg-card p-4 text-sm text-muted-foreground">
          Se o projeto exigir confirmação de e-mail, a conta só entra depois do clique no link. Para testar na hora,
          desative “Confirm email” em Authentication.
        </p>
      </div>
    </main>
  )
}
