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

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: Credentials) {
    setFormError(null)
    try {
      const result = await signUp(values.email, values.password)
      if (result === 'confirm-email') {
        setConfirmEmail(true)
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
      subtitle="As categorias do dia a dia já entram prontas."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {confirmEmail ? (
        <p className="rounded-lg border bg-muted/50 p-4 text-sm">
          Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, você já pode entrar.
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field label="E-mail" htmlFor="signup-email" error={form.formState.errors.email?.message}>
            <TextInput
              id="signup-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="signup-password" error={form.formState.errors.password?.message}>
            <TextInput
              id="signup-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </Field>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
