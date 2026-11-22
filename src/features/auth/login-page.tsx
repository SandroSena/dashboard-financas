import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthShell } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { credentialsSchema, type Credentials } from '@/features/auth/schema'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/dialog'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    document.title = 'Entrar | Finanças'
  }, [])

  async function onSubmit(values: Credentials) {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
      navigate('/painel', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Que bom ver vocês"
      subtitle="Entre para ver como está o mês."
      footer={
        <>
          Primeira vez aqui?{' '}
          <Link to="/criar-conta" className="font-semibold text-brand underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="E-mail" htmlFor="email" error={form.formState.errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
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
          {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
