import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthShell } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { describeAuthError, emailFromState, redirectTarget, type AuthErrorView } from '@/features/auth/auth-errors'
import { credentialsSchema, type Credentials } from '@/features/auth/schema'
import { ServerError } from '@/features/auth/server-error'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { PasswordInput, TextInput } from '@/shared/ui/input'

/** `/entrar` (UX-90, UX-92..UX-94, UX-97). */
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<AuthErrorView | null>(null)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: emailFromState(location.state), password: '' },
    // Erros ao enviar; depois da primeira tentativa, também ao sair do campo.
    reValidateMode: 'onBlur',
  })
  const submitting = form.formState.isSubmitting
  // O foco só pode ir para a senha depois que o fieldset deixa de estar desabilitado.
  const focusPassword = useRef(false)
  useEffect(() => {
    if (!focusPassword.current || submitting) return
    focusPassword.current = false
    form.setFocus('password')
  }, [submitting, form])

  useEffect(() => {
    document.title = 'Entrar | Finanças'
  }, [])

  async function onSubmit(values: Credentials) {
    setServerError(null)
    try {
      await signIn(values.email, values.password)
      navigate(redirectTarget(location.state), { replace: true })
    } catch (error) {
      const view = describeAuthError(error)
      setServerError(view)
      if (view.kind === 'credentials') {
        // UX-92: o e-mail fica; a senha é limpa e recebe o foco.
        form.setValue('password', '')
        focusPassword.current = true
      }
    }
  }

  return (
    <AuthShell
      title="Que bom ver vocês"
      subtitle="Entrem para ver como está o mês."
      footer={
        <>
          Primeira vez aqui?{' '}
          <Link to="/criar-conta" state={location.state} className="rounded-chip font-semibold text-brand underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={submitting} className="grid min-w-0 gap-5">
          <Field label="E-mail" htmlFor="email" error={form.formState.errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              autoFocus
              {...form.register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
            <PasswordInput id="password" autoComplete="current-password" enterKeyHint="go" {...form.register('password')} />
          </Field>
        </fieldset>
        {serverError ? <ServerError>{serverError.text}</ServerError> : null}
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
