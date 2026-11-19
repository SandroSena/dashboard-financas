# Como o projeto é organizado

Um guia rápido para entender o dashboard de finanças: o que foi usado, onde fica cada coisa e por quê.

---

## Em uma frase

É um site em **React** que roda no navegador, guarda os dados no **Supabase** e é publicado na **Vercel**. Não existe servidor próprio: o navegador conversa direto com o banco, e quem protege os dados de cada pessoa é o próprio banco.

```
Navegador (React)  ──►  Supabase (login + banco Postgres)
       ▲
       └── arquivos do site servidos pela Vercel
```

---

## Tecnologias

### O app

| Tecnologia | Para que serve aqui |
| --- | --- |
| **React 19** | Monta as telas. |
| **TypeScript** | JavaScript com tipos: o editor avisa o erro antes de rodar. |
| **Vite** | Roda o app localmente (`npm run dev`) e gera a versão final (`npm run build`). |
| **React Router** | Cuida das páginas (`/painel`, `/lancamentos`...). |
| **Tailwind CSS** | Estilo direto no HTML, com classes como `p-4` e `text-sm`. |
| **Radix UI** | Peças acessíveis prontas, como a janela de diálogo e as abas. |
| **Lucide** | Ícones. |
| **Recharts** | Gráficos do painel. |
| **Sonner** | Avisos rápidos ("Lançamento salvo"). |

### Dados e formulários

| Tecnologia | Para que serve aqui |
| --- | --- |
| **Supabase** | Login e banco de dados (Postgres). |
| **TanStack Query** | Busca os dados, guarda em cache e atualiza a tela depois de salvar. |
| **React Hook Form** | Controla os formulários. |
| **Zod** | Valida o que foi digitado ("Informe o valor."). |
| **date-fns** | Contas com datas e meses. |

### Qualidade e publicação

| Tecnologia | Para que serve aqui |
| --- | --- |
| **Vitest** | Testes automáticos das regras de cálculo. |
| **oxlint** | Aponta erros e más práticas no código. |
| **Husky** | Roda lint, tipos e testes antes de cada `git push`. |
| **GitHub Actions** | Repete as mesmas checagens no GitHub e, se tudo passar, publica. |
| **Vercel** | Hospeda o site. |

---

## Estrutura de pastas

```
dashboard-financas/
├── src/                    código do app
│   ├── main.tsx            ponto de partida: liga o React na página
│   ├── index.css           estilos globais e cores do tema
│   ├── app/                "esqueleto" do app
│   ├── domain/             regras de negócio puras
│   ├── features/           uma pasta por área do app
│   └── shared/             o que várias áreas usam
├── supabase/migrations/    SQL que cria o banco
├── docs/                   esta documentação
├── .github/workflows/      CI/CD (checagens + deploy)
├── .husky/                 checagem antes do push
└── vercel.json, vite.config.ts, tsconfig*.json ...   configurações
```

### `src/app/` — o esqueleto

Liga tudo e não tem regra de negócio.

- `app.tsx`: coloca os "provedores" em volta do app (tema, cache de dados, login). Se o Supabase não estiver configurado, mostra a tela de configuração.
- `router.tsx`: lista as páginas e quem pode ver cada uma. Quem não entrou na conta vai para `/entrar`.
- `app-shell.tsx`: o layout com o menu lateral.

### `src/domain/` — as regras puras

As contas do sistema: somar valores, formatar reais, calcular o mês e montar o resumo do orçamento.

- **Não usa React nem Supabase.** É só TypeScript, por isso é fácil de testar.
- Cada arquivo tem seu teste ao lado (`money.ts` → `money.test.ts`).
- Dinheiro é somado em **centavos inteiros** (`toCents`) para evitar erros como `0.1 + 0.2 = 0.30000000000000004`.

### `src/features/` — as áreas do app

Uma pasta por área que a pessoa usa:

| Pasta | O que faz |
| --- | --- |
| `auth/` | Login, cadastro, sessão e a tela "Conecte o Supabase". |
| `lancamentos/` | Gastos e receitas. |
| `categorias/` | Categorias (Alimentação, Salário...). |
| `orcamentos/` | Limite de gasto por categoria no mês. |
| `painel/` | O dashboard com resumo, gráficos e alertas. |

### `src/shared/` — o que é de todos

| Pasta | O que tem |
| --- | --- |
| `ui/` | Peças visuais básicas: botão, card, diálogo, abas. |
| `components/` | Peças maiores e reutilizáveis: cabeçalho de página, valor em reais, mensagens de carregando/erro, troca de tema. |
| `hooks/` | `use-month-param`: guarda o mês escolhido na URL (`?mes=2026-11`), assim o link compartilhado abre no mesmo mês. |
| `lib/` | Conexão com o Supabase, configuração do TanStack Query e utilitários. |
| `theme/` | Tema claro/escuro. |

### `supabase/migrations/` — o banco

Arquivos SQL, executados em ordem de data. Criam as tabelas (`categories`, `transactions` e `budgets`), as regras de segurança (RLS) e as categorias padrão de cada conta nova.

---

## O padrão escolhido

### 1. Organização por funcionalidade

Em vez de juntar "todas as telas" numa pasta e "todos os serviços" em outra, cada área do app tem **tudo dela no mesmo lugar**. Para mexer em lançamentos, você abre só `features/lancamentos/`.

### 2. Toda feature tem o mesmo formato

Usando `lancamentos/` como exemplo:

```
features/lancamentos/
├── transactions-page.tsx            a tela
├── transaction-dialog.tsx           o formulário (janela)
├── schema.ts                        validação do formulário (Zod)
├── hooks.ts                         buscar/salvar com TanStack Query
└── api/transactions-repository.ts   conversa com o Supabase
```

Cada camada só fala com a de baixo:

```
Tela  ──►  hooks.ts  ──►  repository  ──►  Supabase
```

- **Tela:** só desenha e reage a cliques.
- **hooks.ts:** decide quando buscar e o que atualizar depois de salvar.
- **repository:** é o único lugar que sabe o nome das tabelas e colunas. Ele traduz `occurred_on` (banco) para `occurredOn` (app).

Assim, se o banco mudar, só o repository muda.

### 3. Regras importantes ficam fora das telas

Cálculos ficam em `domain/` (ou em `model.ts`/`insights.ts`, no caso do painel), nunca dentro do componente. A tela recebe os números prontos. Isso deixa as telas simples e as regras testadas.

### 4. Quem pode importar o quê

```
app  ──►  features  ──►  shared
                │
                └────►  domain   (não importa ninguém)
```

- `domain/` não depende de nada do projeto.
- `shared/` não conhece nenhuma feature.
- Uma feature só usa outra quando precisa de verdade. Por exemplo, o painel reaproveita os hooks de lançamentos e categorias.

### 5. Segurança no banco, não no app

A chave do Supabase que vai no navegador é pública. Quem impede uma pessoa de ver os dados de outra é o **RLS** (Row Level Security), configurado na migration: cada linha tem um `user_id`, e o banco só entrega as linhas do usuário logado.

> Variáveis que começam com `VITE_` vão parar no navegador. Nunca coloque nelas a `service_role` do Supabase nem senhas.

### 6. Páginas carregadas sob demanda

As páginas do `router.tsx` usam `lazy()`: o navegador só baixa o código de uma tela quando a pessoa entra nela. O site abre mais rápido.

---

## Caminho de um lançamento

O que acontece quando alguém salva um gasto:

1. A pessoa preenche o formulário em `transaction-dialog.tsx`.
2. O **Zod** (`schema.ts`) confere os dados, por exemplo se o valor é maior que zero.
3. O hook `useCreateTransaction` (`hooks.ts`) chama o repository.
4. O repository grava no Supabase, que confere o RLS.
5. O TanStack Query marca a lista de lançamentos como desatualizada e busca de novo, e a tela se atualiza sozinha.
6. O **Sonner** mostra "Lançamento salvo".

---

## Do código ao ar

```
git push  ──►  Husky (lint, tipos, testes)
          ──►  GitHub Actions (tudo de novo + build)
          ──►  Vercel (publica)
```

- O deploy automático da própria Vercel está **desligado** (`vercel.json`). Quem publica é o GitHub Actions, e só se todas as checagens passarem.
- As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ficam na Vercel como **Config**, não como Secret: variáveis Secret não são baixadas pelo Actions, e o site sobe sem conexão com o banco.
- O `rewrite` do `vercel.json` manda qualquer endereço para o `index.html`, para que recarregar em `/lancamentos` não dê erro 404.

---

## Comandos do dia a dia

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Abre o app em `http://localhost:5173`. |
| `npm test` | Roda os testes. |
| `npm run lint` | Procura problemas no código. |
| `npm run typecheck` | Confere os tipos. |
| `npm run check` | Os três acima de uma vez (o mesmo que o push roda). |
| `npm run build` | Gera a versão final em `dist/`. |

---

## Onde mexer para...

| Quero... | Vá em |
| --- | --- |
| Mudar uma tela | `src/features/<área>/*-page.tsx` |
| Mudar uma validação de formulário | `src/features/<área>/schema.ts` |
| Mudar um cálculo | `src/domain/` (e o teste ao lado) |
| Mudar o que o painel mostra | `src/features/painel/model.ts` e `insights.ts` |
| Criar uma página nova | Uma pasta em `features/` + a rota em `src/app/router.tsx` + o item no menu em `app-shell.tsx` |
| Mudar o banco | Uma **nova** migration em `supabase/migrations/`, sem editar as antigas |
| Mudar cores e tema | `src/index.css` |
