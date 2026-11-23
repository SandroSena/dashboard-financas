# Finanças

Dashboard de finanças pessoais: gastos, receitas, saldo e orçamento do mês, com gráficos e conta no Supabase.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Radix, Recharts, TanStack Query, React Hook Form, Zod, React Router e Supabase.

## Começar

```bash
npm install
copy .env.example .env
```

Preencha no `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (chave anon, nunca a service role)

No SQL Editor do Supabase, rode as migrações nesta ordem, uma de cada vez:

1. [supabase/migrations/20261117120000_init.sql](supabase/migrations/20261117120000_init.sql): cria as tabelas, a RLS e as categorias padrão de cada conta nova.
2. [supabase/migrations/20261117200000_card_games.sql](supabase/migrations/20261117200000_card_games.sql): inclui a categoria Card Games nas contas novas e nas que já existem.
3. [supabase/migrations/20261123120000_hardening.sql](supabase/migrations/20261123120000_hardening.sql): tira os privilégios do papel `anon` e fixa o `search_path` das funções. Como desfazer está no comentário do topo do arquivo.

```bash
npm run dev
```

Se o projeto exigir confirmação de e-mail, a pessoa só entra depois de abrir o link. Para testar na hora, desative “Confirm email” em Authentication, **só num projeto Supabase de teste**. Em produção, deixe “Confirm email” ligado: sem ele, qualquer pessoa cria conta com um e-mail que não é dela.

## Estrutura

Explicação completa das pastas, do padrão e das tecnologias em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

```
src/
  app/          entrada do app: provedores, rotas e layout (menu lateral)
  domain/       regras puras de dinheiro, mês e resumo — sem React, com testes
  features/     uma pasta por área do app
    auth/         login, cadastro e sessão
    categorias/   página, formulário e acesso ao Supabase
    lancamentos/  idem
    orcamentos/   idem
    painel/       dashboard principal: hooks.ts, regras puras (model, insights,
                  ruler, calendar, detail, params, links), charts/ (único lugar
                  com Recharts) e components/ (destaque, régua, cards e folhas)
  shared/       o que mais de uma feature usa: ui/ (primitivas), components/,
                hooks/ (estado na URL, movimento reduzido), lib/ (Supabase,
                paginação, React Query) e theme/
supabase/migrations/   SQL do banco, em ordem de data
```

Cada feature segue o mesmo formato: `*-page.tsx` (tela), `hooks.ts` (React Query), `api/*-repository.ts` (Supabase) e `schema.ts` (validação do formulário com Zod). Uma feature só importa de `domain/`, `shared/` ou de outra feature quando precisa de algo dela (ex.: o painel usa o formulário de lançamento).

## Visual

Design system "Régua": tema escuro por padrão, com tema claro; verde para receitas, rosa para gastos, âmbar para alerta e teal para a marca; títulos em Bricolage Grotesque e texto em Figtree. Os tokens ficam em `src/index.css`; as decisões em [docs/design/design-system.md](docs/design/design-system.md) e o resumo em [docs/ARQUITETURA.md](docs/ARQUITETURA.md#visual).

## Scripts

- `npm run dev` — app local
- `npm test` — totais, saldo, mês e progresso do orçamento
- `npm run build` — checagem de tipos e build
- `npm run lint` — oxlint
