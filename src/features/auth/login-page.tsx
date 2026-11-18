import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthShell } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { credentialsSchema, type Credentials } from '@/features/auth/schema'
import { errorMessage } from '@/shared/lib/supabase'
import { Button } from '@/shared/ui/button'
import { Field, TextInput } from '@/shared/ui/dialog'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

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
      title="Entrar"
      subtitle="Acesse o painel do mês."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="font-medium text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="E-mail" htmlFor="email" error={form.formState.errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
