import { ThemeToggle } from '@/shared/components/theme-toggle'
import { BrandMark } from '@/features/auth/auth-shell'

const steps = [
  'Crie um projeto no Supabase.',
  'Abra o SQL Editor e rode o arquivo supabase/migrations/20261117120000_init.sql.',
  'Em Authentication, copie a URL do projeto e a chave anon.',
  'Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  'Reinicie o servidor de desenvolvimento.',
]

export function ConfigPage() {
  return (
    <main className="relative min-h-svh px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark />
          <span className="text-lg font-semibold">Finanças</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Conecte o Supabase para começar</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O painel guarda lançamentos, categorias e metas na sua conta. A chave anon fica no navegador; quem
          isola os dados de cada pessoa é a política de segurança do banco.
        </p>
        <ol className="mt-8 grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex min-w-0 gap-3 rounded-xl border bg-card p-4 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">
          Se o projeto exigir confirmação de e-mail, a conta só entra depois do clique no link. Para testar na
          hora, desative “Confirm email” nas configurações de Authentication.
        </p>
      </div>
    </main>
  )
}
