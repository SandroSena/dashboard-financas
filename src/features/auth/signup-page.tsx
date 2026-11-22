import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthShell } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { credentialsSchema, type Credentials } from '@/features/auth/schema'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/dialog'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    document.title = 'Criar conta | Finanças'
  }, [])

  async function onSubmit(values: Credentials) {
    setFormError(null)
    try {
      const result = await signUp(values.email, values.password)
      if (result === 'confirm-email') {
        setConfirmEmail(values.email)
        return
      }
      navigate('/painel', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Alimentação, moradia, transporte e as outras categorias do dia a dia já vêm prontas."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="font-semibold text-brand underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {confirmEmail ? (
        <div className="flex gap-3 rounded-xl bg-brand-soft p-4 text-sm" role="status">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <p>
            Enviamos um link de confirmação para <span className="font-semibold">{confirmEmail}</span>. Abra o link e
            depois entre com a senha que você acabou de criar.
          </p>
        </div>
      ) : (
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field label="E-mail" htmlFor="signup-email" error={form.formState.errors.email?.message}>
            <TextInput
              id="signup-email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="signup-password" error={form.formState.errors.password?.message}>
            <PasswordInput
              id="signup-password"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </Field>
          {formError ? (
            <p className="rounded-lg bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
