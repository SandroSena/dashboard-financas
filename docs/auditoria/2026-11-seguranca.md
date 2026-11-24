# Auditoria de segurança: dashboard-financas (novembro de 2026)

**Data:** 2026-11-23 · **Branch:** feat/design-system (commit f261cb6) · **Feita por:** agente `security` · **Modo:** revisão do projeto inteiro (não de um diff)

**Veredito:** Approve. Nenhuma vulnerabilidade crítica, alta ou média. Há 1 baixa e 7 itens de hardening.

## Resumo

Foram revisados:

- as migrações SQL (RLS, triggers, funções e grants);
- a autenticação no front, a proteção de rotas e o tratamento de erros;
- os pontos de XSS e de redirecionamento;
- a configuração da Vercel, o CI e o `.gitignore`;
- os arquivos versionados, na árvore e no histórico;
- as dependências de produção;
- os guardrails do Claude Code.

O isolamento entre contas está bem feito. As tabelas têm RLS com as quatro políticas e `with check`. Os triggers impedem trocar o dono de um registro e apontar para a categoria de outra pessoa. A produção foi testada direto na API REST com a chave publicável, que já é pública: o papel `anon` não lê nem grava nada.

## Modelo de ameaças

- **Pontos de entrada**
  - A API PostgREST (`/rest/v1/*`). Pode ser chamada direto, sem a UI, por qualquer pessoa com a chave publicável.
  - O Supabase Auth (`/auth/v1/*`).
  - O SPA na Vercel (rotas e o parâmetro `?mes`).
  - O GitHub Actions.
- **Fronteiras de confiança**
  - Navegador → PostgREST. A única barreira é RLS + grants + triggers.
  - Navegador → Auth.
  - Actions → Vercel, via `VERCEL_TOKEN`.
- **Ativos**
  - Lançamentos, categorias e orçamentos de cada conta.
  - Os e-mails dos usuários.
  - Os tokens de sessão, guardados no localStorage.
  - O `VERCEL_TOKEN`.
  - A `service_role`, que nunca deve sair do painel do Supabase.
- **Atores**
  - Visitante anônimo.
  - Usuário autenticado que tenta mexer em dados de outra conta.
  - Site de terceiros (clickjacking/XSS).
  - Dependência ou action comprometida no CI.

## Vulnerabilidades

| # | Severidade | Arquivo:linha | Problema | Correção | Confiança |
|---|---|---|---|---|---|
| V-01 | Baixa | `src/shared/lib/supabase.ts:93` | O `mapDbError` termina em `if (message) return message`. Um erro do Postgres/PostgREST que não está mapeado chega cru à tela, em inglês e com nomes de coluna e constraint. Isso fere a regra "sem detalhes internos". O impacto é baixo: só o próprio usuário vê. | `return fallback`, e registrar o erro só em desenvolvimento (`if (import.meta.env.DEV) console.warn(error)`). | 90 |

**Candidatos descartados depois da verificação**

- **`upsert` em `updateTransaction` com o `id` de outra conta.** O caminho de UPDATE exige o USING da política e o trigger também barra. Não sobrescreve dado alheio. O efeito de recriar um registro que já foi excluído é um bug funcional, tratado na revisão de código.
- **Lançamento ou orçamento apontando para a categoria de outra conta.** Os triggers `enforce_*` rodam com os privilégios de quem chama, e o RLS esconde a categoria alheia. O erro é o mesmo para uma categoria inexistente, então não serve como oráculo.
- **Trocar `user_id` ou `kind` da categoria.** É barrado pelo `with check` e pelo `lock_category_identity`.
- **XSS via cor de categoria.** A cor é validada por regex no Zod e por `check` no banco, e chega ao `style` como objeto React. O projeto não usa `dangerouslySetInnerHTML`, `innerHTML` nem `eval`.
- **Open redirect.** Não há parâmetro de redirecionamento, e `?mes` é validado por `isMonthKey`.
- **Enumeração de contas.** O login dá mensagens genéricas. Com a confirmação de e-mail ligada, o cadastro não revela se o e-mail já existe.

## Hardening recomendado

### H-01: headers de segurança na Vercel (o mais importante)

Em produção só existe o HSTS padrão da Vercel. Faltam CSP, `frame-ancestors`/`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. Como a sessão fica no localStorage, a CSP é a principal defesa contra um XSS futuro.

1. Mova o script inline de tema do `index.html` para `public/theme-init.js`. Assim a CSP não precisa de `'unsafe-inline'` em `script-src`.
2. Adicione os headers em `vercel.json`, trocando `<ref>` pelo ref do projeto:

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://<ref>.supabase.co wss://<ref>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
    ]
  }
]
```

O `style-src 'unsafe-inline'` é necessário por causa do `<style>` que o Sonner injeta. Publique primeiro como `Content-Security-Policy-Report-Only` e confira o console antes de ativar.

### H-02: tirar os privilégios do `anon` nas tabelas

Hoje um INSERT como `anon` volta com erro de RLS (42501), não com "permission denied". Ou seja, os grants padrão continuam lá, e só o RLS segura. Para corrigir, crie uma migração nova:

```sql
-- Desfazer: grant select, insert, update, delete on public.categories, public.transactions, public.budgets to anon;
revoke all on public.categories, public.transactions, public.budgets from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;
```

### H-03: `search_path` fixo nas funções

As funções `enforce_transaction_category`, `enforce_budget_category` e `lock_category_identity` não têm `set search_path`. Na `handle_new_user`, que é `security definer`, prefira `''`. Todas já qualificam os nomes com `public.`, então a mudança é segura.

```sql
alter function public.enforce_transaction_category() set search_path = '';
alter function public.enforce_budget_category() set search_path = '';
alter function public.lock_category_identity() set search_path = '';
alter function public.handle_new_user() set search_path = '';
```

### H-04: CI/CD

- Declarar `permissions: { contents: read }` no workflow.
- Fixar as actions por SHA e deixar o Dependabot atualizar.
- Fixar a versão da CLI: `vercel@latest` roda no job que tem o `VERCEL_TOKEN`.
- Passar o token por `env` em vez de `--token=` no argv.
- Configurar regras de proteção no environment `production`. Isso não foi verificado.

### H-05: Supabase Auth (painel)

- O cadastro está aberto. A confirmação de e-mail está ligada e os usuários anônimos estão desligados.
  - Se o app é só da casa, desligue os novos cadastros.
  - Se o cadastro continuar aberto, ative o CAPTCHA.
- A senha mínima de 8 caracteres só existe no Zod. Configure o mínimo de 8 e a "Leaked password protection" no servidor.
- A `config-page.tsx` sugere desligar "Confirm email". Deixe claro que isso vale só para um projeto de teste.
- Confira se "Site URL" e "Redirect URLs" têm só o domínio de produção e `http://localhost:5173`.

### H-06: guardrails do agente e `.gitignore`

- O `.claude/settings.json` não bloqueia estes comandos (e os equivalentes em PowerShell):
  - `git clean -f*`
  - `git push * +*` (força via refspec)
  - `rm -r -f *`
  - `git checkout -- *` e `git restore *`
  - `vercel *`
  - `supabase db reset*`
- A regra `Read(**/.env.*)` também bloqueia o `.env.example`.
- O `.gitignore` deve ganhar `*.pem`, `*.key`, `*.p12` e `secrets/`, para ficar igual aos bloqueios do agente.

### H-07: sessão no localStorage

É o padrão do supabase-js num SPA sem servidor, e é aceitável. A contrapartida é que um XSS rouba o token. A mitigação é aplicar a H-01 e continuar sem HTML cru. Usar cookies HttpOnly exigiria um servidor ou uma Edge Function, com ADR.

## Verificações feitas

| Item | Resultado |
|---|---|
| RLS nas 3 tabelas, com as 4 políticas e `with check` | OK |
| Troca de `user_id`/`kind` e uso da categoria de outra conta | Bloqueadas por política e trigger |
| `handle_new_user` | `search_path = public`; execução revogada; não exposta como RPC |
| `anon` em produção | SELECT devolve `[]`; INSERT dá 42501 |
| Chave no bundle de produção | `sb_publishable_` (nenhuma chave secreta) |
| Segredos versionados (árvore e histórico) | Nenhum |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Permissão padrão do GITHUB_TOKEN | `read` |

## O que não foi revisado

- O conteúdo do `.env.example`, que está bloqueado pelo guardrail.
- A configuração do painel do Supabase além de `/auth/v1/settings`.
- As regras do environment `production` no GitHub.
- O comportamento com um usuário autenticado em produção.

## Perguntas em aberto

- O cadastro deve continuar aberto ao público? (H-05)
- A senha mínima configurada no servidor do Supabase é igual à do Zod (8)?

---

## Re-revisão (2026-11-23, mudanças de feat/design-system)

**Veredito:** Approve. V-01 e H-01 a H-04 foram corrigidos. H-05 a H-07 continuam como recomendação.

- **V-01:** corrigido. O `mapDbError` devolve o `fallback` e só registra o erro em desenvolvimento.
- **H-01:** a CSP não tem `unsafe-inline` em `script-src` e funciona com o `theme-init.js` e o bundle do Vite, que não têm script inline nem `eval`. O `connect-src` cobre https e wss do projeto. As fontes são locais, com mais de 4 KB e sem `data:`. Publique primeiro como `Report-Only`.
- **H-02:** o revoke nas tabelas e o rollback estão corretos.
  - **V-02 (baixa):** o default privilege de funções aplicado por schema não remove o EXECUTE global de PUBLIC. Use `alter default privileges for role postgres revoke execute on functions from public;`.
- **H-03:** `search_path = ''` nas 4 funções, sem quebrar os triggers nem o `handle_new_user`. A migração é idempotente.
- **H-04:** permissões `read`, SHAs conferidos (checkout v5.1.0, setup-node v5.0.0), `vercel@66.6.0` e token por `env`.
- **Superfícies novas, sem achado:**
  - Redirect pós-login: só aceita caminho interno, e a origem vem do `history.state`.
  - Parâmetros de URL validados por allowlist, UUID ou data.
  - Error boundary sem stack.
  - Cores por allowlist.
  - Sem HTML cru.
  - Storage sem dado sensível.
  - O "desfazer" fica preso à sessão atual e passa pelo trigger.
  - O cache é limpo no `SIGNED_OUT`.
- **Dependências:** Radix tooltip, popover e toggle-group com versão fixa e do registry oficial. `npm audit --omit=dev`: 0 vulnerabilidades.
