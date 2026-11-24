# Como o projeto é organizado

Um guia rápido para entender o dashboard de finanças: o que foi usado, onde fica cada coisa e por quê.

---

## Em uma frase

É um site em **React** que roda no navegador, guarda os dados no **Supabase** e é publicado na **Vercel**. Não existe servidor próprio: o navegador conversa direto com o banco, e quem protege os dados de cada pessoa é o próprio banco.

```
Navegador (React)  ──►  Supabase (login + banco Postgres)
       ▲
       └── arquivos do site servidos pela Vercel (com cabeçalhos de segurança)
```

---

## Tecnologias

### O app

| Tecnologia | Para que serve aqui |
| --- | --- |
| **React 19** | Monta as telas. |
| **TypeScript** | JavaScript com tipos: o editor avisa o erro antes de rodar. |
| **Vite** | Roda o app localmente (`npm run dev`) e gera a versão final (`npm run build`). |
| **React Router** | Cuida das páginas (`/painel`, `/lancamentos`...) e dos parâmetros da URL. Usa o *data router* (`createBrowserRouter`), que permite uma tela de erro por rota. |
| **Tailwind CSS** | Estilo direto no HTML, com classes como `p-4` e `text-body-sm`. |
| **Radix UI** | Peças acessíveis prontas: diálogo, abas, tooltip, popover e grupo de botões (`toggle-group`). |
| **Lucide** | Ícones. |
| **Recharts** | Gráficos do painel (só dentro de `features/painel/charts/`). |
| **Sonner** | Avisos rápidos ("Lançamento salvo."). |
| **Fontsource** | As fontes (Bricolage Grotesque e Figtree) instaladas pelo npm, sem depender do Google Fonts. |

### Dados e formulários

| Tecnologia | Para que serve aqui |
| --- | --- |
| **Supabase** | Login e banco de dados (Postgres). |
| **TanStack Query** | Busca os dados, guarda em cache e atualiza a tela depois de salvar. |
| **React Hook Form** | Controla os formulários. |
| **Zod** | Valida o que foi digitado ("Informem o valor."). |
| **date-fns** | Contas com datas e meses. |

### Qualidade e publicação

| Tecnologia | Para que serve aqui |
| --- | --- |
| **Vitest** | Testes automáticos das regras puras (dinheiro, mês, painel, URL, erros, paginação) e as guardas de estrutura (`codebase-guards.test.ts`). Ainda não há testes de componente nem E2E. |
| **oxlint** | Aponta erros e más práticas no código. |
| **Husky** | Roda lint, tipos e testes antes de cada `git push`. |
| **GitHub Actions** | Repete as checagens no GitHub e, se tudo passar, publica. |
| **Vercel** | Hospeda o site. |

---

## Estrutura de pastas

```
dashboard-financas/
├── index.html              página base; carrega public/theme-init.js e o app
├── public/                 arquivos servidos como estão (favicon, theme-init.js)
├── src/                    código do app
│   ├── main.tsx            ponto de partida: liga o React na página
│   ├── index.css           tokens do design system (cores, tipografia, movimento...)
│   ├── app/                "esqueleto" do app
│   ├── domain/             regras de negócio puras
│   ├── features/           uma pasta por área do app
│   └── shared/             o que várias áreas usam
├── supabase/migrations/    SQL que cria e protege o banco
├── docs/                   esta documentação, ADRs, design e auditorias
├── .github/workflows/      CI/CD (checagens + deploy)
├── .husky/                 checagem antes do push
└── vercel.json, vite.config.ts, tsconfig*.json ...   configurações
```

### `src/app/` — o esqueleto

Liga tudo e não tem regra de negócio.

- `app.tsx`: coloca os "provedores" em volta do app (tema, tooltip, cache de dados, login) e o `Toaster`. Se o Supabase não estiver configurado, mostra a tela de configuração.
- `router.tsx`: lista as páginas e quem pode ver cada uma. Quem não entrou na conta vai para `/entrar` e, depois de entrar, volta para o link que tinha aberto. Cada página entra com `lazy()`.
- `app-shell.tsx`: o layout com o menu lateral (barra de baixo no celular), o link "Pular para o conteúdo" e o `<main id="conteudo">`.
- `route-error-boundary.tsx` e `chunk-reload.ts`: a tela de erro de rota (ver "Quando algo dá errado").

### `src/domain/` — as regras puras

As contas do sistema: somar valores, formatar reais, calcular o mês e montar o resumo do orçamento.

- **Não usa React nem Supabase.** É só TypeScript, por isso é fácil de testar.
- Cada arquivo tem seu teste ao lado (`money.ts` → `money.test.ts`).
- Dinheiro é somado em **centavos inteiros** (`toCents`) para evitar erros como `0.1 + 0.2 = 0.30000000000000004`.

### `src/features/` — as áreas do app

Uma pasta por área que a pessoa usa:

| Pasta | O que faz |
| --- | --- |
| `auth/` | Login, cadastro, sessão, tradução dos erros de login e a tela "Conecte o Supabase". |
| `lancamentos/` | Gastos e receitas, com filtros na URL (`filters.ts`, `use-transaction-filters.ts`) e o lançamento rápido. |
| `categorias/` | Categorias (Alimentação, Salário...), com abas de gastos/receitas na URL. |
| `orcamentos/` | Limite de gasto por categoria no mês (`model.ts` monta as linhas e o resumo). |
| `painel/` | O dashboard com destaque do mês, régua, gráficos, folhas de detalhe e destaques. |

#### Por dentro do `painel/`

O painel é a área maior, então ele tem mais arquivos de regra. Todos os `.ts` são puros e testados (arquivo `.test.ts` ao lado).

| Arquivo | O que faz |
| --- | --- |
| `dashboard-page.tsx` | A tela: só layout e os estados (carregando, erro, sem categorias, mês vazio). |
| `hooks.ts` | `useDashboardData` (categorias, 12 meses de lançamentos e metas numa orquestração só), `usePrefetchDashboard` (carrega o mês vizinho no hover/foco das setas), `useDashboardModel` (modelo e leituras memoizados) e `useDashboardParams` (estado do painel na URL). |
| `model.ts` | Monta o `DashboardModel`: meses, totais, uso das metas, dias, recentes. |
| `insights.ts` | Leituras do mês: comparação (mês anterior ou média de 3 meses), ritmo, projeção, destaques e as frases da tela. |
| `ruler.ts` | A régua do mês: quanto da receita já saiu, a marca de hoje, a comparação e o cursor de dia. |
| `calendar.ts` | "Dias do mês": mapa de calor do gasto por dia, com nível por quintil. |
| `detail.ts` | O conteúdo das folhas de detalhe por categoria (`buildCategoryDetail`) e por dia (`buildDayDetail`). Devolve `null` para id ou dia que não existe, e a folha não abre. |
| `params.ts` | Lê e valida os parâmetros do painel (`?comparar`, `?janela`, `?categoria`, `?dia`). |
| `links.ts` | Os links do painel para as outras telas (`/lancamentos?mes=&tipo=&categoria=`, `/orcamentos?mes=&categoria=`). |
| `format.ts`, `motion.ts` | Formatos curtos (eixo, dia da semana) e a regra "anima só na primeira abertura da sessão". |
| `announcer.tsx`, `announce-context.ts`, `actions-context.ts` | Região viva para o leitor de tela ("Painel de outubro de 2026: sobraram...") e as ações compartilhadas entre os cards (abrir folha, novo lançamento, editar). |
| `charts/` | **O único lugar que importa `recharts`**: `spending-pace.tsx` (ritmo), `evolution-chart.tsx` (evolução 6/12 meses), `sparkline.tsx`, `chart-tooltip.tsx`, `data-table.tsx` (a alternativa em tabela) e `layout.ts`. |
| `components/` | Os cards: `month-hero.tsx` e `month-ruler.tsx` (destaque e régua), `kpi-cards.tsx`, `breakdown-card.tsx` (para onde foi o dinheiro), `pace-card.tsx`, `budgets-card.tsx`, `recent-card.tsx`, `calendar-card.tsx`, `evolution-card.tsx`, `highlights-card.tsx`, `empty-month.tsx`, as folhas `category-sheet.tsx` e `day-sheet.tsx`, e peças internas (`panel-card.tsx`, `card-parts.tsx`, `transaction-list.tsx`, `dashboard-header.tsx`, `view-options.ts`). |

Os três layouts de laboratório (Comando, Fluxo e Atlas) **foram removidos**. O que valia a pena deles, como o calendário de gastos, virou card do painel principal.

### `src/shared/` — o que é de todos

`shared/` não conhece nenhuma feature. Ele tem três níveis:

| Pasta | O que tem |
| --- | --- |
| `ui/` | **Primitivas sem regra de negócio** (não importam `@/domain` nem `@/features`): `button`, `card`, `badge`, `dialog` (`AppDialog`, `ConfirmDialog`), `sheet` (folha lateral no desktop, de baixo no celular), `field` + `field-context`, `input`, `select` (nativo), `control.ts` (visual comum de campo), `segmented` (sobre o Radix ToggleGroup, com setas e foco itinerante), `tabs`, `tooltip`, `popover`, `skeleton`, `progress` (`role="progressbar"`) e `use-return-focus`. |
| `components/` | **Peças compostas, com regra de apresentação**: `amount` e `money-text` (valor em reais), `feedback` (vazio, erro e esqueletos), `page-header`, `month-switcher` + `month-grid` (seletor de mês com prefetch), `delta` + `delta-format` (variação com seta e sinal), `category-avatar`, `brand-mark`, `row-flash` (marca a linha recém-salva) e `theme-toggle`. |
| `hooks/` | `use-month-param` (o mês em `?mes=AAAA-MM`), `use-search-param` e `use-prefers-reduced-motion` (ver abaixo). |
| `lib/` | Conexão com o Supabase e tradução de erros (`supabase.ts`), paginação (`paginate.ts`), TanStack Query (`query-client.ts`, `query-keys.ts`), textos de erro (`error-copy.ts`, `toast-error.ts`), paleta de categorias (`category-colors.ts`), atalhos de teclado (`keyboard.ts`), foco (`roving.ts`, `return-focus.ts`) e utilitários. |
| `theme/` | Tema claro/escuro. |

Os dois hooks novos:

- **`use-search-param`**: lê e grava **um** parâmetro da URL já validado. Traz os validadores `oneOf([...])` (lista fechada) e `uuidParam` (ids do Supabase), e as funções puras `readParam` e `withParam`. Valor ausente, vazio ou inválido vira o padrão, e o padrão some da URL para o link ficar curto. Por padrão grava com `push` (o "Voltar" desfaz); para abas e filtros, use `history: 'replace'`.
- **`use-prefers-reduced-motion`**: a única fonte do "reduzir movimento" para o JavaScript. O CSS já zera as durações sozinho; o hook desliga o que o CSS não alcança, como a animação do Recharts (`isAnimationActive={!reducedMotion}`) e a rolagem suave. O mesmo arquivo exporta `useMediaQuery`.

### `supabase/migrations/` — o banco

Arquivos SQL, executados **em ordem**, um de cada vez, no SQL Editor do Supabase:

1. `20261117120000_init.sql`: cria as tabelas (`categories`, `transactions` e `budgets`), os CHECKs que espelham o Zod, os triggers que impedem trocar o dono ou o tipo, o RLS nas três tabelas e as categorias padrão de cada conta nova.
2. `20261117200000_card_games.sql`: inclui a categoria Card Games nas contas novas e nas que já existem.
3. `20261123120000_hardening.sql`: tira do papel `anon` (quem não entrou) todos os privilégios nas tabelas e nos objetos futuros do schema `public`, e fixa `search_path = ''` nas quatro funções. Como desfazer está no comentário do topo.

> A ordem importa: a `card_games` recria `handle_new_user` com `search_path = public`. Se ela for rodada de novo, rode a `hardening` depois.

Migração aplicada não se edita: cada mudança é um arquivo novo, idempotente, com o "como desfazer" no topo.

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
- **repository:** é o único lugar que sabe o nome das tabelas e colunas. Ele traduz `occurred_on` (banco) para `occurredOn` (app) e transforma qualquer erro do Supabase num `DataError`.

Assim, se o banco mudar, só o repository muda. O painel segue o mesmo formato: o `painel/hooks.ts` junta os hooks de lançamentos, categorias e orçamentos, e a tela não chama nenhum deles direto.

### 3. Regras importantes ficam fora das telas

Cálculos ficam em `domain/` (ou nos `.ts` puros do painel: `model.ts`, `insights.ts`, `ruler.ts`, `calendar.ts`, `detail.ts`, `params.ts`), nunca dentro do componente. A tela recebe os números prontos. Isso deixa as telas simples e as regras testadas.

### 4. Quem pode importar o quê

```
app  ──►  features  ──►  shared
                │
                └────►  domain   (não importa ninguém)
```

- `domain/` não depende de nada do projeto.
- `shared/` não conhece nenhuma feature, e `shared/ui/` também não conhece o `domain/`.
- Uma feature só usa outra quando precisa de verdade. Por exemplo, o painel reaproveita os hooks de lançamentos, categorias e orçamentos e o formulário de lançamento.

### 5. Segurança no banco, não no app

A chave do Supabase que vai no navegador é pública. Quem impede uma pessoa de ver os dados de outra é o **RLS** (Row Level Security), configurado na migração: cada linha tem um `user_id`, e o banco só entrega as linhas do usuário logado. A migração de hardening completa isso: quem não entrou na conta (`anon`) nem chega às políticas, e as funções `security definer` não dependem do `search_path`.

> Variáveis que começam com `VITE_` vão parar no navegador. Nunca coloque nelas a `service_role` do Supabase nem senhas.

### 6. Páginas carregadas sob demanda

As páginas do `router.tsx` usam `lazy()`: o navegador só baixa o código de uma tela quando a pessoa entra nela. O Recharts fica só no pedaço (chunk) do painel, por isso ele não pode ser importado fora de `features/painel/charts/`.

---

## Estado na URL

O que vale compartilhar fica na URL: o link abre a tela no mesmo lugar, e recarregar não perde nada. Todo parâmetro é validado antes do uso (lista fechada, UUID ou data); valor desconhecido vira o padrão e nunca chega a uma consulta. Um id de outra conta simplesmente não é encontrado, porque o RLS não devolve a categoria.

| Parâmetro | Onde | Valores | Padrão | Histórico |
| --- | --- | --- | --- | --- |
| `?mes` | todas as telas com mês | `AAAA-MM` | mês atual | `push` |
| `?comparar` | painel | `anterior` \| `media` (média de 3 meses) | `anterior` | `replace` |
| `?janela` | painel (gráfico de evolução) | `6` \| `12` | `6` | `replace` |
| `?categoria` | painel (abre a folha da categoria), lançamentos (filtro), orçamentos (rola até a linha) | UUID | nenhum | painel: `push`; filtros: `replace` |
| `?dia` | painel (abre a folha do dia) | `AAAA-MM-DD` do mês aberto | nenhum | `push` |
| `?tipo` | lançamentos (filtro) e categorias (aba) | `todos` \| `gastos` \| `receitas` | `todos` / `gastos` | `replace` |
| `?busca` | lançamentos (filtro) | texto, até 80 caracteres | vazio | `replace` |

Regras do painel:

- Só uma folha por vez: se o link trouxer `?categoria` e `?dia`, vale a categoria.
- Abrir uma folha cria entrada no histórico, então o "Voltar" do navegador fecha a folha. Trocar de uma folha para outra não empilha histórico.
- Categoria que não existe mais ou dia de outro mês: a folha não abre, o parâmetro sai da URL e um aviso explica.
- O painel sempre busca **12 meses numa só consulta**. A troca 6/12 e a média de 3 meses saem da mesma lista, sem nova carga.
- Em Lançamentos, um valor fora do formato oficial é reescrito (`tipo=expense` vira `tipo=gastos`, `categoria=abc` sai).

---

## Dados: cache, paginação e erros

### Cache (TanStack Query)

- `query-client.ts`: os dados valem por 30 s (`staleTime`) e uma falha tenta mais uma vez.
- `query-keys.ts`: as chaves começam pela tabela (`['transactions', ...]`, `['budgets', ...]`, `['categories']`). Depois de salvar, o hook invalida pelo prefixo, e todas as telas que usam aquela tabela atualizam. Excluir uma categoria também invalida as metas, porque o banco apaga as metas dela em cascata.
- **`keepPreviousData`**: nas consultas por mês e por intervalo, trocar de mês mantém os dados do mês anterior na tela (esmaecidos, com uma barra fina de carregando) até o novo chegar, em vez de voltar ao esqueleto. O painel sabe a que mês pertencem os dados mostrados (`shownMonth`).
- **Prefetch**: passar o mouse ou focar as setas do seletor de mês já carrega o mês vizinho.
- **Saída da conta**: no evento `SIGNED_OUT` do Supabase (botão Sair, outra aba, token revogado ou expirado), o `auth-context.tsx` limpa todo o cache (`queryClient.clear()`). Os lançamentos de uma conta nunca sobram para a próxima pessoa no mesmo navegador.

### Paginação (`shared/lib/paginate.ts`)

O Supabase devolve no máximo 1000 linhas por requisição e **corta o resto sem avisar**. Por isso toda listagem sem limite passa por `listAllPages` (em `supabase.ts`), que usa o `fetchAllPages`:

- pede páginas de 1000 com `.range(from, to)` até vir uma página incompleta;
- a consulta precisa de ordem total e estável, terminando numa coluna única (`occurred_on`, `created_at`, `id`), senão linhas se repetem ou somem entre páginas;
- se **qualquer** página falhar, a chamada inteira rejeita com `DataError`: nunca devolve um total parcial;
- há um teto de 1000 páginas contra laço infinito.

### Erros (`DataError`)

O repository nunca deixa o erro cru do banco chegar à tela. `toDataError(error, 'Não foi possível ...')` transforma qualquer erro do Supabase num `DataError` com:

- **uma mensagem em português**, segura para mostrar (sem SQL, nome de constraint ou tabela). O que não é reconhecido vira a mensagem de fallback da operação;
- **um `code` semântico**, para a tela decidir o que fazer sem comparar texto: `unique_violation`, `fk_violation`, `check_violation`, `invalid_input`, `business_rule`, `not_found`, `auth`, `permission` e `network`. A tela nunca usa o código cru do Postgres (`23505`).

As mensagens falam com a casa no plural, a voz "vocês": "Sem conexão. Confiram a internet e tentem de novo.", "A sessão expirou. Entrem de novo.", "Informem uma data válida.". Frases sem pedido de ação ficam impessoais ("Registro não encontrado."). Os textos de erro de tela saem de `error-copy.ts`, que só acrescenta uma orientação ("Confiram a conexão e tentem de novo.") quando a mensagem ainda não orienta.

### Quando algo dá errado na tela (`RouteErrorBoundary`)

As rotas têm `errorElement={<RouteErrorBoundary />}`. Os erros das páginas do app aparecem dentro do layout, então o menu continua usável; os de login e do próprio layout aparecem na raiz.

- **Chunk que não existe mais**: depois de um deploy, uma aba aberta pede o código de uma página com o nome antigo. O `chunk-reload.ts` reconhece esse erro e recarrega a página **uma vez** sozinho (a marca fica no `sessionStorage` por 15 s, para não entrar em laço). Se falhar de novo, aparece "Saiu uma versão nova do app" com o botão "Recarregar".
- **Qualquer outro erro**: "Esta tela não abriu", com "Recarregar" e "Ir para o painel". Nunca mostra stack nem mensagem técnica (só vai para o console em desenvolvimento).
- Para isso funcionar, a `rewrite` do `vercel.json` não manda `/assets/` para o `index.html`: um arquivo de código que sumiu dá 404 de verdade, e não uma página HTML no lugar do JavaScript.

---

## Visual

A **fonte da verdade dos tokens é o `src/index.css`**, e as decisões estão explicadas em [`docs/design/design-system.md`](design/design-system.md) (design system "Régua", [ADR-0002](adr/0002-design-system-regua.md)). As specs de cada tela ficam em `docs/design/telas/`. Não existe outro arquivo de tokens.

Resumo:

- **Cores com significado**: `income` (verde: receitas, meta em dia), `expense` (rosa: gastos, meta estourada), `warning` (âmbar: alerta, a partir de 80% da meta) e `brand`/`primary` (teal: marca e ação). Cada uma tem a versão `-soft` para fundos. Esses tons não são usados como enfeite, e cor nunca aparece sozinha: sempre com sinal, seta, ícone ou texto.
- **Neutros com o tom da marca**: "tinta" no escuro (o padrão) e "névoa" no claro, em degraus de superfície (`background`, `sunken`, `card`, `popover`). Todos os pares de texto passam WCAG AA nos dois temas.
- **Gráficos**: `chart-muted` para a série de comparação, `seq-1` a `seq-5` para o calendário, e 8 cores de categoria (`cat-azul` ... `cat-ardosia`). O banco guarda um hex, que vira um slot da paleta em `shared/lib/category-colors.ts`; cores antigas são mapeadas sem migração.
- **Tipografia**: Bricolage Grotesque (`font-display`) nos títulos e Figtree (`font-sans`) no resto, em escala de tokens (`text-caption`, `text-label`, `text-body-sm`, `text-body`, `text-title`, `text-heading`, `text-display`, `text-hero`). Classes próprias: `surface` (card com fio de 1px), `figure` (algarismos tabulares), `eyebrow` (rótulo acima de um valor, em caixa normal), `numeral`/`numeral-hero` (número grande).
- **Elevação, raios e movimento**: sombras `shadow-edge`, `shadow-raised`, `shadow-overlay`, `shadow-dialog`; raios por papel (`rounded-chip`, `rounded-control`, `rounded-card`, `rounded-sheet`); durações `--duration-*` e easings `ease-standard`, `ease-fluid`, `ease-exit`. Só a régua e o número do destaque animam sozinhos, uma vez por sessão. Com "reduzir movimento", nada anima.

> Não coloque `font-feature-settings` no `html`: ele é herdado e anula a classe `tabular-nums`.

### Regras que a revisão confere

1. `recharts` só é importado em `src/features/painel/charts/`.
2. `src/shared/ui/` não importa `@/domain` nem `@/features`.
3. Nenhum hex (`#1a2b3c`), `shadow-[...]` ou `duration-[...]` em arquivos `.tsx`: use os tokens. As cores de categoria entram por `style`, com `var(--cat-*)`.
4. Todo controle funciona com teclado (Tab, setas, Enter/Espaço, Escape), e todo gráfico tem a alternativa em tabela.
5. Valores em reais usam `amount.tsx`/`money-text.tsx`; carregando, vazio e erro usam `feedback.tsx`.

As regras 1 e 3 são automáticas: `src/app/codebase-guards.test.ts` lê o código como texto e falha o `npm test` (e o CI) se elas forem quebradas. O mesmo arquivo confere a rewrite e a CSP do `vercel.json`, a falta de script inline no `index.html` e o workflow de CI (tipos uma vez, Vercel CLI com versão fixa, deploy só na `main`).

### Como o painel é montado

Uma ordem só para todas as larguras: a ordem do código (DOM) é a ordem de leitura e de Tab, sem `order-*` no CSS. Só a quantidade de colunas muda (1 no celular, 2 no `lg`, 12 no `xl`).

1. **Cabeçalho** (`dashboard-header.tsx`): seletor de mês e comparação (mês anterior ou média de 3 meses).
2. **Destaque do mês** (`month-hero.tsx` + `month-ruler.tsx`): quanto sobra, uma frase de contexto e a régua, que dá para percorrer dia a dia com o mouse ou o teclado.
3. **Indicadores** (`kpi-cards.tsx`): receitas, gastos, saldo e metas, com a variação e a tendência da janela.
4. **Para onde foi o dinheiro** e **Ritmo de gastos**: clicar numa categoria abre a folha da categoria.
5. **Metas**, **Lançamentos recentes** e **Dias do mês** (calendário): clicar num dia abre a folha do dia.
6. **Evolução** (6 ou 12 meses; clicar num mês vai para ele) e **Destaques**.

---

## Caminho de um lançamento

O que acontece quando alguém salva um gasto:

1. A pessoa preenche o formulário em `transaction-dialog.tsx`.
2. O **Zod** (`schema.ts`) confere os dados, por exemplo se o valor é maior que zero ("Informem um valor maior que zero, com até duas casas.").
3. O hook `useCreateTransaction` (`hooks.ts`) chama o repository.
4. O repository grava no Supabase, que confere o RLS. Se der erro, ele lança um `DataError` com a mensagem em português.
5. O TanStack Query marca os lançamentos como desatualizados (todas as chaves `['transactions', ...]`) e busca de novo, e a tela se atualiza sozinha.
6. O **Sonner** mostra "Lançamento salvo." e a linha salva pisca de leve (`row-flash`).

Editar usa `update` (e não `upsert`): se o lançamento foi excluído em outra aba, aparece "Registro não encontrado." e ele não volta a existir.

---

## Do código ao ar

```
git push  ──►  Husky (lint, tipos, testes)
          ──►  GitHub Actions (lint, testes, tipos + build)
          ──►  Vercel (publica, só na main)
```

- O deploy automático da própria Vercel está **desligado** (`vercel.json`). Quem publica é o GitHub Actions, só no push para `main` e só se todas as checagens passarem.
- O CI (`.github/workflows/ci.yml`):
  - roda `npm ci`, `npm run lint`, `npm test` e `npm run build`. O `build` já faz a checagem de tipos (`tsc -b`), então ela roda uma vez só;
  - usa as actions fixadas por SHA (`checkout` e `setup-node` v5) e o token do GitHub só com leitura (`permissions: contents: read`);
  - instala o Vercel CLI numa **versão fixa**, para um release novo não quebrar o deploy sem aviso;
  - publica no environment `production` do GitHub, com o token da Vercel lido do ambiente (não aparece na linha de comando).
- As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ficam na Vercel como **Config**, não como Secret: variáveis Secret não são baixadas pelo Actions, e o site sobe sem conexão com o banco.
- O `rewrite` do `vercel.json` manda qualquer endereço, **menos `/assets/`**, para o `index.html`. Recarregar em `/lancamentos` não dá 404, e um arquivo de código que não existe dá 404 de verdade.

### Cabeçalhos de segurança (`vercel.json`)

Todas as respostas levam:

| Cabeçalho | Para quê |
| --- | --- |
| `Content-Security-Policy` | Só carrega script, fonte e imagem do próprio site; só conversa com o domínio do projeto Supabase (`https` e `wss`); não pode ser embutido em outro site. Já está **aplicada** (não em modo Report-Only). |
| `X-Frame-Options: DENY` | Ninguém coloca o app dentro de um `iframe`. |
| `X-Content-Type-Options: nosniff` | O navegador não "adivinha" o tipo do arquivo. |
| `Referrer-Policy: strict-origin-when-cross-origin` | O endereço completo não vaza para outros sites. |
| `Permissions-Policy` | Câmera, microfone, localização e pagamento desligados. |

Consequências da CSP:

- **Nada de script inline.** Por isso o tema é aplicado pelo `public/theme-init.js`, carregado no `<head>` do `index.html` antes do app: ele põe a classe `dark` (o padrão) se o tema salvo não for "light", e a tela não pisca. Não mova esse código para dentro do `index.html`.
- `style-src` aceita `'unsafe-inline'` porque o Sonner injeta um `<style>`.
- **Mudou o projeto Supabase ou entrou um serviço externo?** Atualize o `connect-src` (e o que mais for preciso) no `vercel.json`, senão o navegador bloqueia a conexão.

---

## Comandos do dia a dia

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Abre o app em `http://localhost:5173`. |
| `npm test` | Roda os testes. |
| `npm run lint` | Procura problemas no código. |
| `npm run typecheck` | Confere os tipos. |
| `npm run check` | Os três acima de uma vez (o mesmo que o push roda). |
| `npm run build` | Confere os tipos e gera a versão final em `dist/`. |

---

## Onde mexer para...

| Quero... | Vá em |
| --- | --- |
| Mudar uma tela | `src/features/<área>/*-page.tsx` |
| Mudar uma validação de formulário | `src/features/<área>/schema.ts` (mensagem no plural: "Informem...", "Escolham...") |
| Mudar um cálculo | `src/domain/` (e o teste ao lado) |
| Mudar o que o painel mostra | `src/features/painel/model.ts` e `insights.ts` (régua: `ruler.ts`; calendário: `calendar.ts`; folhas: `detail.ts`) |
| Mudar um gráfico | `src/features/painel/charts/` (o único lugar com Recharts) |
| Criar ou mudar um parâmetro de URL | o `params.ts`/`filters.ts` da feature, com os validadores de `shared/hooks/use-search-param.ts` |
| Mudar os links do painel para outras telas | `src/features/painel/links.ts` (e o leitor do outro lado, como `lancamentos/filters.ts`) |
| Mudar uma mensagem de erro do banco | `classifyDbError` em `src/shared/lib/supabase.ts` (e o teste ao lado) |
| Mudar a tela de erro de rota | `src/app/route-error-boundary.tsx` e `chunk-reload.ts` |
| Criar uma peça visual reutilizável | `src/shared/ui/` (sem regra de negócio) ou `src/shared/components/` (com regra de apresentação) |
| Criar uma página nova | Uma pasta em `features/` + a rota (`lazy()`) em `src/app/router.tsx` + o item no menu em `app-shell.tsx` |
| Mudar o banco | Uma **nova** migração em `supabase/migrations/`, sem editar as antigas, e o README com a ordem |
| Mudar cores, fontes ou movimento | `src/index.css` (tokens), seguindo `docs/design/design-system.md` |
| Liberar um domínio novo (API, imagem, fonte) | a CSP no `vercel.json` |
