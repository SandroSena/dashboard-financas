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

No SQL Editor do Supabase, rode [supabase/migrations/20261117120000_init.sql](supabase/migrations/20261117120000_init.sql). O script cria as tabelas, a RLS e as categorias padrão de cada conta nova.

```bash
npm run dev
```

Se o projeto exigir confirmação de e-mail, a pessoa só entra depois de abrir o link. Para testar na hora, desative “Confirm email” em Authentication.

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
    painel/       dashboard principal (model, insights, charts, components/)
      layouts/    variações experimentais do painel (Comando, Fluxo, Atlas)
  shared/       o que mais de uma feature usa: ui/ (botão, card, diálogo),
                components/, hooks/, lib/ (Supabase, React Query) e theme/
supabase/migrations/   SQL do banco, em ordem de data
```

Cada feature segue o mesmo formato: `*-page.tsx` (tela), `hooks.ts` (React Query), `api/*-repository.ts` (Supabase) e `schema.ts` (validação do formulário com Zod). Uma feature só importa de `domain/`, `shared/` ou de outra feature quando precisa de algo dela (ex.: o painel usa o formulário de lançamento).

## Scripts

- `npm run dev` — app local
- `npm test` — totais, saldo, mês e progresso do orçamento
- `npm run build` — checagem de tipos e build
- `npm run lint` — oxlint
