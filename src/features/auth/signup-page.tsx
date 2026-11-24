import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthShell } from '@/features/auth/auth-shell'
import { useAuth } from '@/features/auth/auth-context'
import { describeAuthError, redirectTarget, type AuthErrorView } from '@/features/auth/auth-errors'
import { credentialsSchema, type Credentials } from '@/features/auth/schema'
import { ServerError } from '@/features/auth/server-error'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { PasswordInput, TextInput } from '@/shared/ui/input'

const linkClass = 'rounded-chip font-semibold text-brand underline-offset-4 hover:underline'

/** `/criar-conta` (UX-95, UX-96). */
export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<(AuthErrorView & { email: string }) | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const confirmHeading = useRef<HTMLDivElement>(null)
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
    reValidateMode: 'onBlur',
  })
  const submitting = form.formState.isSubmitting

  useEffect(() => {
    document.title = confirmEmail ? 'Confiram o e-mail | Finanças' : 'Criar conta | Finanças'
    if (confirmEmail) confirmHeading.current?.focus()
  }, [confirmEmail])

  async function onSubmit(values: Credentials) {
    setServerError(null)
    try {
      const result = await signUp(values.email, values.password)
      if (result === 'confirm-email') {
        setConfirmEmail(values.email.trim())
        return
      }
      navigate(redirectTarget(location.state), { replace: true })
    } catch (error) {
      setServerError({ ...describeAuthError(error), email: values.email.trim() })
    }
  }

  if (confirmEmail) {
    return (
      <AuthShell
        title="Confiram o e-mail"
        subtitle={
          <p>
            Mandamos um link para <span className="font-semibold break-all text-foreground">{confirmEmail}</span>. Abram o link
            para ativar a conta e depois entrem por aqui.
          </p>
        }
      >
        <div ref={confirmHeading} tabIndex={-1} role="status" className="grid gap-6 focus-visible:outline-none">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
            <MailCheck className="size-6" />
          </span>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link to="/entrar" state={{ ...(location.state as object | null), email: confirmEmail }}>
              Voltar para entrar
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Vamos começar"
      subtitle="Uma conta para a casa toda acompanhar o mês."
      footer={
        <>
          Já têm conta?{' '}
          <Link to="/entrar" state={location.state} className={linkClass}>
            Entrar
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={submitting} className="grid min-w-0 gap-5">
          <Field label="E-mail" htmlFor="signup-email" error={form.formState.errors.email?.message}>
            <TextInput
              id="signup-email"
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
          {/* UX-96: a ajuda aparece antes de qualquer erro, ligada por aria-describedby (Field). */}
          <Field
            label="Senha"
            htmlFor="signup-password"
            hint="Pelo menos 8 caracteres."
            error={form.formState.errors.password?.message}
          >
            <PasswordInput id="signup-password" autoComplete="new-password" enterKeyHint="go" {...form.register('password')} />
          </Field>
        </fieldset>
        {serverError ? (
          <ServerError>
            {serverError.text}
            {serverError.kind === 'exists' ? (
              <>
                {' '}
                <Link to="/entrar" state={{ ...(location.state as object | null), email: serverError.email }} className="font-semibold underline underline-offset-4">
                  Entrar com esse e-mail
                </Link>
              </>
            ) : null}
          </ServerError>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  )
}
