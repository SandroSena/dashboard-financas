# Auditoria de arquitetura e blueprint do redesign (nov/2026)

**Autor:** `architect` · **Data:** 2026-11-23 · **Branch analisada:** `feat/design-system` (commit `f261cb6`)
**Decisão relacionada:** [ADR-0001](../adr/0001-design-system-e-redesign.md) (Aceito em 2026-11-23; ver a seção 7)

Escopo: todo o `src/`, `supabase/migrations/`, `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `vercel.json`, `.github/workflows/ci.yml`, `.husky/pre-push`, `index.html`, `README.md` e `docs/ARQUITETURA.md`. RLS e login ficam com o `security`, e a revisão linha a linha com o `code-reviewer`. Aqui aparece só o que afeta a arquitetura, a performance, a acessibilidade estrutural, os testes e o CI.

---

## 1. O que está bom (manter)

- O fluxo **tela → hooks → repository → Supabase** é respeitado em todas as features. Só os repositories conhecem tabela e coluna (`src/features/lancamentos/api/transactions-repository.ts:33-57`).
- O domínio é puro e soma em centavos (`src/domain/summary.ts:35-40`, `src/domain/money.ts:35`), e o `Intl.NumberFormat` é reaproveitado (`src/domain/money.ts:7-8`).
- As páginas usam `lazy()`, e o Recharts só aparece em `features/painel/` (`src/app/router.tsx:6-28`). Ele já fica fora do chunk inicial.
- O modelo do painel é calculado fora da tela, com testes (`src/features/painel/model.ts`, `insights.ts`, 10 testes).
- Já há uma alternativa acessível a gráficos: o botão gráfico/tabela (`src/features/painel/components/card-parts.tsx:6`, `trend-cards.tsx:44-66`), e as variações aparecem com seta e sinal (`kpi-cards.tsx:139-175`).
- O CI bloqueia o deploy, o pre-push roda a mesma checagem e o deploy automático da Vercel está desligado (`vercel.json:6`).
- O banco tem integridade boa: CHECKs que espelham o Zod, triggers que impedem trocar o dono ou o tipo, e RLS nas 3 tabelas (`supabase/migrations/20261117120000_init.sql`).

## 2. Achados (com evidência)

### Dados e consistência

- **D-01: o histórico do painel pode ser cortado sem aviso.** `listTransactionsBetween` busca até 6 meses sem paginar (`transactions-repository.ts:47-57`). Por padrão, a API do Supabase (PostgREST) devolve no máximo 1000 linhas por requisição (`max_rows`). Passando disso, os totais, a tendência e o ritmo ficam errados sem nenhum erro. Com a janela de 12 meses do redesign o risco cresce. *Correção:* paginar com `.range()` em ordem determinística (`occurred_on`, `id`) dentro do repository, até vir uma página incompleta. O schema não muda.
- **D-02: editar um lançamento já excluído recria o registro.** `updateTransaction` usa `upsert(..., { onConflict: 'id' })` (`transactions-repository.ts:78-95`). Se o lançamento foi excluído em outra aba, a edição faz um INSERT com o mesmo id. *Correção:* `.update({...}).eq('id', id).select().single()`. O `PGRST116` vira "Registro não encontrado." (já mapeado em `src/shared/lib/supabase.ts:73`).
- **D-03: excluir uma categoria deixa as metas antigas na tela.** O `on delete cascade` apaga os budgets (`init.sql:39`), mas `useDeleteCategory` só invalida `categories` (`src/features/categorias/hooks.ts:35-41`). *Correção:* invalidar também `['budgets']` e `['transactions']`.
- **D-04: contas com dinheiro fora do domínio.** Há subtração de `number` direto na tela: `detail-cards.tsx:29` e `:88`, `trend-cards.tsx:26`, `charts.tsx:125`. O valor exibido sai certo porque `formatBrl` arredonda, mas os testes de sinal (`remaining >= 0`) podem errar por resíduo de ponto flutuante, e isso fere a regra "Dinheiro exato". *Correção:* `subtractMoney(a, b)` em `src/domain/money.ts`, com teste.
- **D-05: invalidação em dobro (inofensivo).** `queryKeys.transactionsAll` (`['transactions']`) já cobre `transactions(month)`, e os três hooks invalidam as duas (`src/features/lancamentos/hooks.ts:24-25`, `42-43`, `53-54`).

### Estrutura e duplicação

- **E-01: os três layouts experimentais duplicam o painel.** São Comando, Fluxo e Atlas (`src/features/painel/layouts/`, 6 arquivos e cerca de 900 linhas). O módulo de gráficos é paralelo, com um `Sparkline` de API diferente (`layouts/charts.tsx:78` contra `charts.tsx:239`), outro tooltip (`MoneyTooltip` contra `TooltipCard`), outro `tick` e outro formatador compacto (`layouts/charts.tsx:34-35` contra `format.ts`). A lista de variantes também aparece duas vezes (`src/app/app-shell.tsx:22-27` e `layouts/layout-switcher.tsx:5-10`). E o `DashboardModel` calcula campos que só os labs usam (`weekdays`, `scatter`, `calendar`, `stackSeries/stackPoints`, `daily`, `flow`, `incomeSlices`; `model.ts:84-94`).
- **E-02: a orquestração das queries do painel está copiada.** `dashboard-page.tsx:27-33` e `layouts/lab-frame.tsx:21-27` são iguais, e `lab-frame` nem memoiza o modelo (`:45-47`). O painel não tem `hooks.ts` e foge do formato padrão de feature.
- **E-03: `shared/ui/dialog.tsx` guarda 7 componentes**, cinco deles de formulário (`Field`, `TextInput`, `PasswordInput`, `NativeSelect`, `Segmented`, `:88-191`). Quem importa um input de "dialog" se perde.
- **E-04: o mesmo padrão visual aparece em vários lugares.**
  - Controle segmentado ×4: `dialog.tsx:154`, `card-parts.tsx:6`, `tabs.tsx:9`, `layout-switcher.tsx:18`.
  - Barra de progresso ×4, e só uma tem `role="progressbar"`: `budget-meter.tsx:20`, `detail-cards.tsx:101`, `kpi-cards.tsx:233`, `charts.tsx:318`.
  - Estado vazio ×4: `feedback.tsx:4`, `card-parts.tsx:45`, `layouts/charts.tsx:45`, `detail-cards.tsx:145`.
  - Avatar de categoria ×2: `transaction-groups.tsx:49`, `categories-page.tsx:72`.
  - Esqueletos montados à mão: `feedback.tsx:39-76`.
- **E-05: a peça de marca está dentro de uma feature.** `BrandMark` mora em `features/auth/auth-shell.tsx:7` e o `app-shell.tsx:1` importa de lá. É marca, então o lugar é `shared/components/brand-mark.tsx`.
- **E-06: constantes repetidas.** `'__outros__'` aparece em `model.ts:19` e `insights.ts:131`. A cor `'#94a3b8'` (`insights.ts:131`) é diferente de `FALLBACK_COLOR` (`summary.ts:32`). Os rótulos dos dias da semana aparecem em `model.ts:18` e `atlas-page.tsx:15`.

### Tokens (base do design system)

- **K-01: hex e sombras fixos nos componentes**, contra a regra do `CLAUDE.md`:
  - hex: `button.tsx:14` (`dark:text-[#2a0710]`), `insights.ts:131`, `dialog.tsx:145` (stroke `%23888888` no SVG do select), `auth-shell.tsx:31-83` (`#eaf6f4`, `#22c55e`);
  - sombras arbitrárias repetidas: `charts.tsx:28`, `dialog.tsx:23`, `app-shell.tsx:131` e `:142`, `kpi-cards.tsx:111`, `card-parts.tsx:24`, `dialog.tsx:180`, `tabs.tsx:22`.
- **K-02: âmbar fora de alerta.** O KPI "Metas" usa `bg-warning-soft text-warning` sempre, mesmo com a meta em dia (`kpi-cards.tsx:204`). Isso fere "verde/vermelho/âmbar reservados". Fica para o `designer`.

### Performance e bundle

- **P-01: a tela pisca a cada troca de mês.** As queries não usam `placeholderData: keepPreviousData`, então mudar `?mes=` mostra o esqueleto inteiro de novo (`dashboard-page.tsx:48-49`). O painel interativo precisa de troca de período sem esse salto.
- **P-02: o Recharts fica só no chunk do painel.** Está bom hoje, mas nada garante isso. Basta importar um gráfico de `shared/` ou do `app-shell` para ele ir para o chunk inicial. É uma regra a fixar (ADR-0001, decisão 2) e a medir no CI (C-03).
- **P-03: os labs custam um chunk lazy cada e levam muito mais componentes do Recharts** (Radar, Treemap, Scatter, RadialBar, Pie). Removê-los (E-01) reduz o código e as rotas.
- **P-04 (menor):** `formatShortDate` cria um `Intl.DateTimeFormat` a cada chamada (`src/domain/month.ts:70`), justo o que `money.ts:7` evita.

### Robustez de navegação

- **R-01: não há error boundary nem recuperação quando um chunk falha.** As rotas usam `<Routes>` declarativo, sem `errorElement`, e não existe boundary em `AppShell`/`AppRouter` (`router.tsx:30-55`). Depois de um deploy, um usuário com a aba aberta pede um chunk com hash antigo. A rewrite `"/(.*)" → /index.html` (`vercel.json:7`) devolve HTML no lugar do JS, o `import()` dinâmico falha e a tela fica em branco.

### Acessibilidade estrutural

- **A-01: o `Segmented` declara `role="radiogroup"` mas não tem setas nem foco itinerante** (`dialog.tsx:168-189`). O teclado passa por todas as opções com Tab, o que contraria o padrão ARIA de radiogroup.
- **A-02: animações JS dos gráficos.** A regra global `prefers-reduced-motion` (`index.css:289-297`) cobre CSS, mas pode não cobrir a animação do Recharts (`charts.tsx:172`, `:219`, `:224`). É preciso verificar e, se necessário, controlar pela prop.
- **A-03: não há link "Pular para o conteúdo"**, e o foco não vai para o conteúdo novo na troca de rota (`app-shell.tsx:124-128`).
- **A-04: contraste do avatar de categoria.** O texto usa a cor da categoria sobre `${color}24` (`transaction-groups.tsx:51`), e cores claras (ex.: `#eab308`) falham no tema claro. Fica para o `designer`.
- **A-05: os filtros de Lançamentos ficam só em `useState`** (`transactions-page.tsx:26-27`), então o link não guarda o tipo nem a categoria. O drill-down do painel depende disso.

### Testes

- **T-01:** nenhum teste leva ID de critério (`AC-..`), contra a convenção do `CLAUDE.md`. `mapDbError`/`errorMessage` (`src/shared/lib/supabase.ts:62-95`) são puras e não têm teste, assim como a regra de `historyBounds`/janela.
- **T-02:** não há testes de componente nem E2E (é uma decisão registrada no `CLAUDE.md`). O redesign aumenta a interação (teclado, popover, URL), e a verificação manual fica cara. Isso pede um ADR próprio (jsdom + Testing Library, ou Vitest browser mode + Playwright), proposto pelo `qa-engineer`.
- **T-03:** a cobertura é declarada como obrigatória para `src/domain` e as regras do painel, mas não há medição nem limite (`vitest.config.ts` sem `coverage`).

### CI e DX

- **C-01:** o `vercel@latest` não tem versão fixa (`ci.yml:56`), então o deploy pode quebrar com um release do CLI.
- **C-02:** o CI roda `tsc -b` duas vezes (`ci.yml:27` e `build` = `tsc -b && vite build`, `package.json:8`). Custa uns segundos.
- **C-03:** não há relatório nem limite de tamanho de bundle.
- **C-04:** o README manda rodar só `init.sql` (`README.md:21`), mas existe uma segunda migração (`20261117200000_card_games.sql`). O `init.sql` já tem "Card Games" (`init.sql:154`), o que sugere que ele foi editado depois de aplicado. Não vale reescrever (ele já roda), mas a regra "não editar migração aplicada" precisa ser reforçada.
- **C-05 (banco, baixo):** faltam índices nas FKs `transactions.category_id` e `budgets.category_id`. O `on delete restrict`/`cascade` varre a tabela ao excluir uma categoria. É irrelevante no volume atual; registrado só para quando houver outra migração.

## 3. Backlog priorizado

Prioridade = (Impacto + Risco) × (6 − Esforço), com notas de 1 a 5. Esforço 1 = até 1 h, 3 = cerca de 1 dia.

| # | Item | Achados | I | R | E | Prio. | Dono |
|---|---|---|---|---|---|---|---|
| 1 | Paginar `listTransactionsBetween` (e `listTransactions`) | D-01 | 4 | 4 | 2 | **32** | backend-engineer |
| 2 | Error boundary de rota + recarga em falha de chunk; rewrite sem `/assets/` | R-01 | 3 | 4 | 2 | **28** | frontend-engineer |
| 3 | `keepPreviousData` + prefetch do mês vizinho | P-01 | 4 | 1 | 1 | **25** | frontend-engineer |
| 4 | `updateTransaction` com `update` em vez de `upsert` | D-02 | 2 | 3 | 1 | **25** | backend-engineer |
| 5 | Consolidar o painel: `painel/hooks.ts` (`useDashboardData`) e sair dos labs | E-01, E-02, P-03 | 4 | 2 | 2 | **24** | frontend-engineer (após decisão do usuário) |
| 6 | Dividir `dialog.tsx` + `Segmented` sobre ToggleGroup (teclado) | E-03, E-04, A-01 | 3 | 2 | 2 | **20** | frontend-engineer |
| 7 | Tokens de sombra, movimento e "outros"; tirar hex dos componentes | K-01, E-06 | 2 | 2 | 1 | **20** | designer → frontend-engineer |
| 8 | Invalidar metas e lançamentos ao excluir categoria | D-03 | 2 | 2 | 1 | **20** | frontend-engineer |
| 9 | `usePrefersReducedMotion` nos gráficos | A-02 | 2 | 2 | 1 | **20** | frontend-engineer |
| 10 | CI: fixar a versão do Vercel CLI, typecheck uma vez, relatório de bundle | C-01..C-03 | 2 | 2 | 1 | **20** | backend-engineer |
| 11 | IDs de AC nos testes, testes de `mapDbError`/janela, cobertura com limite; ADR de testes de componente | T-01..T-03 | 3 | 3 | 3 | **18** | qa-engineer (+ architect no ADR) |
| 12 | Primitivas compartilhadas (Progress, Skeleton, EmptyState, Badge, CategoryAvatar) | E-04, A-04 | 3 | 1 | 2 | **16** | frontend-engineer |
| 13 | Filtros de Lançamentos na URL (`?tipo=`, `?categoria=`) | A-05 | 3 | 1 | 2 | **16** | frontend-engineer |
| 14 | `subtractMoney` no domínio e uso nas telas | D-04 | 1 | 2 | 1 | **15** | backend-engineer |
| 15 | Link "Pular para o conteúdo" + foco no `<main>` ao trocar de rota | A-03 | 2 | 1 | 1 | **15** | frontend-engineer |
| 16 | README: listar todas as migrações em ordem; atualizar `ARQUITETURA.md` no fim | C-04 | 2 | 1 | 1 | **15** | architect |
| 17 | `BrandMark` para `shared/components`; `Intl.DateTimeFormat` reaproveitado | E-05, P-04 | 1 | 1 | 1 | **10** | frontend-engineer |
| 18 | Índices nas FKs `category_id` (na próxima migração) | C-05 | 1 | 1 | 1 | **10** | backend-engineer |
| 19 | KPI "Metas" sem âmbar fixo; contraste do avatar | K-02, A-04 | 1 | 1 | 1 | **10** | designer |

**Fora do backlog, porque não se justificam hoje:** Edge Functions ou RPC de agregação (a paginação resolve D-01 no volume pessoal), coluna `updated_at` (nenhuma tela precisa), cache persistente do TanStack Query, troca de biblioteca de gráficos, `"strict"` explícito no tsconfig (o TypeScript 7 já liga `strict` por padrão; vale declarar só se o `code-reviewer` preferir deixar explícito).

---

## 4. Blueprint do redesign (estrutura)

### 4.1 Mapa de pastas depois do redesign

```
src/
  index.css                         tokens (fonte da verdade): + sombras, durações, --chart-other
  shared/
    ui/                             primitivas SEM domínio (não importam @/domain)
      button.tsx                    (existe) sem hex no destructive
      card.tsx                      (existe)
      dialog.tsx                    AppDialog, ConfirmDialog, DialogActions (só isso)
      sheet.tsx                     NOVO: painel lateral (desktop) / folha de baixo (celular) sobre Radix Dialog
      field.tsx                     NOVO: Field (movido de dialog.tsx)
      input.tsx                     NOVO: TextInput, PasswordInput (movidos)
      select.tsx                    NOVO: NativeSelect (movido; seta via currentColor, sem hex)
      segmented.tsx                 NOVO: Segmented sobre @radix-ui/react-toggle-group (texto e/ou ícone)
      tabs.tsx                      (existe)
      tooltip.tsx                   NOVO: @radix-ui/react-tooltip (Provider único em app.tsx)
      popover.tsx                   NOVO: @radix-ui/react-popover
      skeleton.tsx                  NOVO: <Skeleton className> (pulse respeita reduced-motion)
      badge.tsx                     NOVO: tons neutral|income|expense|warning|brand, sempre com ícone ou sinal quando o tom tem significado
      progress.tsx                  NOVO: barra com role="progressbar", aria-valuenow/min/max, tone, fill-in opcional
    components/
      amount.tsx, money-text.tsx    (existem)
      feedback.tsx                  EmptyState (absorve ChartEmpty/EmptyChart, variante compact), QueryError, Skeletons de página feitos com <Skeleton>
      page-header.tsx               só PageHeader
      month-switcher.tsx            NOVO (movido de page-header): + prop onPrefetch?(month)
      delta.tsx                     NOVO (movido de kpi-cards): variação com seta e sinal + goodWhen
      category-avatar.tsx           NOVO: inicial + cor da categoria com contraste garantido (regra do designer)
      brand-mark.tsx                NOVO (movido de features/auth/auth-shell.tsx)
      theme-toggle.tsx              (existe)
    hooks/
      use-month-param.ts            (existe)
      use-search-param.ts           NOVO: lê/grava um parâmetro validado (genérico, usado por janela/comparar/categoria/tipo)
      use-prefers-reduced-motion.ts NOVO: matchMedia + listener
    lib/ ... (existe)
  app/
    router.tsx                      sem as rotas /painel/comando|fluxo|atlas (se aprovado)
    app-shell.tsx                   sem panelVariants; skip link; <main id="conteudo" tabIndex={-1}>; RouteErrorBoundary em volta do <Outlet>
    route-error-boundary.tsx        NOVO: captura erro de render e de chunk; "Recarregar" (1 recarga automática por sessão para erro de chunk)
  features/painel/
    dashboard-page.tsx              só layout + estados (loading/erro/vazio)
    hooks.ts                        NOVO: useDashboardData(month, janela) e usePrefetchDashboard()
    model.ts                        buildDashboardModel(month, months, ...) com janela parametrizada; campos só dos labs removidos ou mantidos conforme a spec
    insights.ts                     + comparação com a média da janela; constantes de "Outros" num lugar só
    category-detail.ts              NOVO: buildCategoryDetail(...) puro + category-detail.test.ts
    params.ts                       NOVO: parse/validação de ?janela, ?comparar, ?categoria (puro, testado)
    charts/                         NOVO: ÚNICO lugar que importa recharts
      chart-tooltip.tsx             TooltipCard unificado
      chart-frame.tsx               container com role="img"/aria-label + alternativa em tabela
      spending-pace.tsx, monthly-bars.tsx, sparkline.tsx, category-breakdown.tsx, data-table.tsx
    components/
      summary-cards.tsx, kpi-cards.tsx, trend-cards.tsx, detail-cards.tsx (existem)
      period-controls.tsx           NOVO: janela (3/6/12) + comparar (anterior/média) em Popover/Segmented
      category-detail-sheet.tsx     NOVO: drill-down por categoria em <Sheet>
    layouts/                        REMOVIDO (se aprovado)
  features/lancamentos/
    transactions-page.tsx           filtros ?tipo= e ?categoria= via use-search-param
  domain/
    money.ts                        + subtractMoney
```

Regras que o `code-reviewer` verifica:

1. `recharts` só é importado em `src/features/painel/charts/**`.
2. `src/shared/ui/**` não importa `@/domain` nem `@/features`.
3. Nenhum `#[0-9a-f]{3,8}`, `shadow-[` ou `duration-[` em `src/**/*.tsx`. As exceções são as cores de categoria vindas do banco, aplicadas por `style`.
4. Todo controle novo funciona com teclado (Tab, setas, Enter/Espaço, Escape).

### 4.2 Componentes base que faltam

| Componente | Base | Substitui | Observação |
|---|---|---|---|
| Segmented | `@radix-ui/react-toggle-group` (`type="single"`) | `Segmented`, `ViewToggle`, `LayoutSwitcher` | Setas e foco itinerante; não deixa desmarcar tudo (`onValueChange` ignora vazio) |
| Tooltip | `@radix-ui/react-tooltip` | `title=` em `charts.tsx:299` e `atlas-page.tsx:72` | Abre no foco e no hover; nunca leva informação que falte em outro lugar |
| Popover | `@radix-ui/react-popover` | (novo) | Controles de período/comparação no celular |
| Sheet | `@radix-ui/react-dialog` (existe) | (novo) | Drill-down; folha de baixo no celular, painel lateral no desktop |
| Select | `<select>` nativo | `NativeSelect` | Sem Radix Select (ADR-0001) |
| Skeleton | CSS | `animate-pulse` montado à mão | |
| Badge | `cva` | pílulas do `Delta` e do status de meta | |
| Progress | CSS | 4 barras | `role="progressbar"` sempre, ou `aria-hidden` quando o número está ao lado |
| EmptyState | existe | `ChartEmpty`, `EmptyChart`, vazio inline | variantes `page` e `compact` |
| CategoryAvatar | CSS | 2 cópias | contraste definido pelo `designer` |

### 4.3 Interatividade possível só com o frontend (sem mudança de banco)

Volume de referência: uso pessoal. Uma janela de 12 meses fica na casa de centenas a poucos milhares de linhas, e tudo é calculado no navegador sobre os dados que o hook já tem.

| ID | Interação | Estado | Onde fica a regra |
|---|---|---|---|
| I-01 | **Troca de janela** do histórico: 3, 6 ou 12 meses (padrão 6) nos gráficos de tendência e sparklines | `?janela=3\|6\|12`; inválido → 6 | `painel/params.ts`, `model.ts` (`historyBounds(month, months)`) |
| I-02 | **Comparação**: variação dos KPIs contra o mês anterior (padrão) ou a média dos meses da janela | `?comparar=anterior\|media` | `insights.ts` |
| I-03 | **Drill-down por categoria**: clicar ou dar Enter numa categoria ("Para onde foi o dinheiro", metas) abre uma folha com o total do mês, a variação, a média da janela, as barras por mês, a meta e os lançamentos da categoria no mês, com link "Ver em Lançamentos" | `?categoria=<id>`; id desconhecido → remove o parâmetro e não abre | `category-detail.ts` |
| I-04 | **Lançamentos filtrados pela URL**: `/lancamentos?mes=&tipo=&categoria=` (destino do drill-down) | URL | `transactions-page.tsx` + `use-search-param` |
| I-05 | **Destaque cruzado**: hover/foco numa categoria da lista destaca o segmento da régua de composição (o resto fica com opacidade menor) | `useState` | `category-breakdown.tsx` |
| I-06 | **Tooltips**: tooltip único nos gráficos (rótulo, valor com sinal, comparação); dica de cálculo nos KPIs ("Saldo = receitas − gastos") | — | `chart-tooltip.tsx`, `tooltip.tsx` |
| I-07 | **Troca de período sem salto**: dados anteriores visíveis (opacos) enquanto o mês novo carrega; prefetch do mês vizinho no hover/foco das setas | — | `painel/hooks.ts` (`placeholderData: keepPreviousData`, `prefetchQuery`) |
| I-08 | **Movimento**: entrada escalonada dos cards (CSS), réguas `fill-in`, animação de gráfico curta. Tudo desligado com `prefers-reduced-motion`. **Sem** contagem animada de números (atrapalha leitor de tela e movimento reduzido) | — | `index.css` + `use-prefers-reduced-motion` |
| I-09 | **Gráfico ou tabela** em todos os gráficos com dados (não só em 2) | `useState` | `chart-frame.tsx` |

Não dá para fazer só no frontend, e fica fora: orçamento por período diferente de mês, metas de economia, recorrência ou lançamento parcelado. Tudo isso exige modelo de dados novo e um blueprint próprio.

### 4.4 Dados e contratos

- **Schema:** nenhuma mudança. Nenhuma tabela, coluna ou política RLS nova.
- **Repository:** `listTransactionsBetween(start, end)` e `listTransactions(month)` paginam internamente (páginas de 1000, `.order('occurred_on').order('id')`, `.range(from, to)`), e a assinatura não muda. Uma página com erro rejeita a operação inteira, sem devolver dado parcial.
- **Tipos:** `src/domain/types.ts` não muda. Tipos novos ficam só no painel: `HistoryWindow = 3 | 6 | 12`, `CompareMode = 'anterior' | 'media'`, `CategoryDetail`.
- **Query keys:** `transactionsRange(start, end)` continua; a janela muda o `start`. Prefetch usa a mesma key.

### 4.5 Fluxo de dados (drill-down, exemplo)

1. O usuário ativa a categoria "Alimentação" em `category-breakdown.tsx`, e o `setParam('categoria', id)` acrescenta `?categoria=` (com histórico, para o "Voltar" fechar a folha).
2. `dashboard-page.tsx` lê `parseDashboardParams(searchParams)` → `{ janela, comparar, categoria }`.
3. `useDashboardData(month, janela)` já tem `categories`, `history` e `budgets` em cache, e nada é buscado de novo.
4. `buildCategoryDetail(month, janela, categoryId, categories, history, budgets)` é puro e devolve `null` se o id não existe nas categorias do usuário.
5. `category-detail-sheet.tsx` desenha o resultado. Fechar remove o parâmetro, e o foco volta ao item que abriu a folha.

### 4.6 Detalhes críticos

- **Erros:** falha de query → `QueryError` (texto em português, sem detalhe interno). Falha de chunk → `RouteErrorBoundary`, com uma recarga automática por sessão (`sessionStorage`) e depois o botão "Recarregar". Os textos ficam com o `designer`.
- **Consistência:** paginação em ordem determinística. Mutations invalidam por prefixo (`['transactions']`, `['budgets']`, `['categories']`).
- **Performance:** `buildDashboardModel` + `buildInsights` memoizados por `[month, janela, data]`. `Intl.*Format` criados uma vez. O Recharts continua só no chunk do painel.
- **Segurança:** `?categoria=` só filtra dados que o RLS já devolveu ao usuário, e um id de outra conta simplesmente não é encontrado. Os parâmetros são validados contra a lista ou o regex antes de chegar a qualquer `.eq()` (o supabase-js já parametriza).
- **Acessibilidade:** um `h1` por página; folha com `Dialog.Title`; tooltip nunca é o único lugar de uma informação; cor sempre com sinal, seta ou ícone; foco visível com `--ring`.

### 4.7 Sequência de construção

**Fase 0: correções independentes (podem começar já, em paralelo com o design)**
- [ ] backend-engineer: item 1 (paginação) + teste do helper de paginação com cliente falso, se extraído como função pura de montagem de páginas.
- [ ] backend-engineer: item 4 (`update` em vez de `upsert`), item 14 (`subtractMoney` + teste), item 10 (CI).
- [ ] frontend-engineer: item 2 (`route-error-boundary.tsx`; trocar a rewrite em `vercel.json` para `"source": "/((?!assets/).*)"`), item 8 (invalidação).

**Fase 1: fundação do design system (depende da spec de tokens do `designer`)**
- [ ] Tokens novos em `src/index.css`; remover hex e sombras fixas (K-01).
- [ ] Instalar `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-toggle-group`.
- [ ] Dividir `shared/ui/dialog.tsx` (field, input, select) e criar segmented, tooltip, popover, sheet, skeleton, badge, progress.
- [ ] `shared/components`: month-switcher, delta, category-avatar, brand-mark; EmptyState unificado.
- [ ] `shared/hooks`: `use-search-param`, `use-prefers-reduced-motion`.
- [ ] Migrar as telas existentes para as peças novas, sem mudar o comportamento.

**Fase 2: painel (depende da Fase 1 e da spec do painel)**
- [ ] `painel/hooks.ts`, `params.ts` (+ teste), janela em `model.ts` (+ teste), comparação em `insights.ts` (+ teste), `category-detail.ts` (+ teste).
- [ ] `painel/charts/` (mover e unificar), `period-controls.tsx`, `category-detail-sheet.tsx`.
- [ ] Remover `layouts/`, as rotas e `panelVariants` (se aprovado) e enxugar o `DashboardModel`.

**Fase 3: lançamentos e acabamento**
- [ ] Filtros na URL em Lançamentos (I-04), skip link e foco (A-03).

**Fase 4: documentação**
- [ ] architect: README (migrações), `docs/ARQUITETURA.md` (pastas, Visual, Peças), ADR-0001 → Accepted.

Track backend (Fase 0, itens 1/4/10/14) e track frontend (Fases 0 a 3) andam em paralelo. O ponto de contato é só a assinatura dos repositories, que não muda.

### 4.8 Hand-offs

**`designer`** (specs em `docs/design/` antes do `frontend-engineer` começar a Fase 1/2):
- tokens novos: elevação, durações, `--chart-other`, regra de contraste do avatar de categoria; resolver K-02;
- componentes base: Segmented, Tooltip, Popover, Sheet, Badge, Progress, Skeleton, EmptyState (estados: padrão, hover, foco, desabilitado, carregando);
- telas: Painel (hero, KPIs, controles de janela/comparação, composição com drill-down, estados vazio/erro/carregando), folha de detalhe da categoria, Lançamentos com filtros, tela de erro de rota;
- quais visualizações dos labs (se houver alguma) voltam para o painel principal.

**`security`:**
- `route-error-boundary.tsx`: não mostrar stack nem mensagem interna;
- parâmetros de URL (`categoria`, `tipo`, `janela`, `comparar`): validação antes do uso;
- supply chain dos 3 pacotes Radix novos e a versão fixa do Vercel CLI;
- `vercel.json`: já que a rewrite vai mudar, avaliar cabeçalhos de segurança (CSP, `X-Content-Type-Options`, `Referrer-Policy`);
- D-02 (`upsert` → `update`).

---

## 5. Critérios de aceite

Legenda de verificação: **[unit]** teste Vitest em `node` com o ID no nome; **[manual]** verificação rodando `npm run dev` (até existir o ADR de testes de componente, T-02); **[CI]** checagem automatizada no pipeline ou por busca no código.

### Dados

- **AC-01** [unit] Dado um usuário com 1.500 lançamentos na janela, quando o painel carrega o histórico, então os 1.500 chegam ao modelo, e receitas, gastos e saldo batem com a soma em centavos de todos eles.
- **AC-02** [unit] Dado que a segunda página da busca falha, quando o repository monta o histórico, então a operação rejeita com `DataError` e nenhum total parcial é devolvido.
- **AC-03** [manual] Dado um lançamento aberto para edição em uma aba e excluído em outra, quando a pessoa salva a edição, então aparece "Registro não encontrado." e o lançamento **não** volta a existir.
- **AC-04** [manual] Dada uma categoria com meta no mês, quando a pessoa exclui a categoria, então a meta some de Orçamentos e do painel sem recarregar a página.
- **AC-05** [unit] Dados limite R$ 100,10 e gasto R$ 100,10, quando o restante é calculado com `subtractMoney`, então o resultado é exatamente 0 e o texto é "Restam R$ 0,00".

### Navegação e robustez

- **AC-06** [manual] Dada uma aba aberta antes de um deploy, quando a pessoa entra numa página cujo chunk não existe mais, então o app recarrega uma vez sozinho. Se falhar de novo, aparece uma tela em português com o botão "Recarregar", sem stack nem mensagem técnica.
- **AC-07** [manual] Dado um pedido a `/assets/inexistente.js`, quando a Vercel responde, então o status é 404 e não o `index.html`.

### Interatividade do painel

- **AC-08** [manual] Dado o painel de novembro carregado, quando a pessoa troca para outubro, então o conteúdo de novembro continua visível (com indicação de carregando) até outubro chegar, e o esqueleto inteiro **não** aparece.
- **AC-09** [manual] Dado o foco ou o hover na seta "Mês anterior", quando a pessoa clica nela, então os dados do mês anterior já estão em cache (aba Network sem nova requisição de `transactions` ao trocar).
- **AC-10** [unit] Dado `?janela=12`, quando os parâmetros são lidos, então a janela é 12 e `historyBounds('2026-11', 12).start` é `2025-12-01`. Dado `?janela=7` ou `?janela=abc`, a janela é 6.
- **AC-11** [manual] Dado `/painel?mes=2026-11&janela=12&comparar=media`, quando o link é aberto em outra aba, então a tela abre no mesmo mês, janela e comparação.
- **AC-12** [unit] Dado `comparar=media`, quando os insights são calculados, então a comparação usa a média dos até 3 meses anteriores ao mês aberto **que tiveram lançamento** (acumulado por dia; dia que não existe num mês curto usa o último dia). Sem nenhum mês anterior com lançamento, a variação é `null` e a tela mostra "Sem meses anteriores para a média". _(Revisado em 2026-11-23 para seguir a regra decidida em UX-21/UX-22; a versão original pedia 5 meses com os vazios valendo zero.)_
- **AC-13** [manual] Dada a lista "Para onde foi o dinheiro", quando a pessoa ativa uma categoria com clique, Enter ou Espaço, então a folha de detalhe abre com o total do mês, a variação, as barras por mês da janela, a meta (se houver) e os lançamentos da categoria, e a URL ganha `?categoria=<id>`.
- **AC-14** [manual] Dada a folha de detalhe aberta, quando a pessoa aperta Escape, clica em Fechar ou usa o "Voltar" do navegador, então a folha fecha, `?categoria=` sai da URL e o foco volta ao item que a abriu.
- **AC-15** [unit] Dado um `categoryId` que não está nas categorias do usuário (inexistente ou de outra conta), quando `buildCategoryDetail` é chamado, então devolve `null`. [manual] Na tela, a folha não abre e o parâmetro é removido.
- **AC-16** [manual] **Acesso negado:** dado o usuário B abrindo um link do usuário A com `?categoria=<id de A>`, quando o painel carrega, então nenhum nome, valor ou lançamento de A aparece (o RLS não devolve, e AC-15 trata o id).
- **AC-17** [manual] Dado o link "Ver em Lançamentos" na folha, quando a pessoa clica, então `/lancamentos?mes=…&tipo=expense&categoria=<id>` abre com os dois filtros já aplicados, e recarregar a página mantém os filtros.
- **AC-18** [manual] Dado um mês sem gastos, quando o painel abre, então a composição mostra o estado vazio da spec, e nenhum item de categoria é clicável.
- **AC-19** [manual] Dados gráficos com dados, quando a pessoa usa o botão gráfico/tabela, então cada gráfico de tendência mostra uma tabela com os mesmos números, e o botão funciona com Tab, setas e Espaço.

### Acessibilidade e movimento

- **AC-20** [manual] Dado o `Segmented` (tipo do lançamento, gráfico/tabela, janela), quando o foco entra nele com Tab, então só a opção ativa recebe foco, as setas mudam a opção e Tab sai do grupo.
- **AC-21** [manual] Dado um KPI com dica, quando a pessoa foca o ícone de ajuda pelo teclado, então o tooltip abre, é lido como descrição (`aria-describedby`) e fecha com Escape.
- **AC-22** [manual] Dado o sistema com "reduzir movimento" ligado, quando o painel abre ou troca de mês, então nenhum gráfico, régua ou card anima (a animação de gráfico fica desligada pela prop, não só pela regra CSS).
- **AC-23** [manual] Dada a primeira tecla Tab em qualquer página logada, quando a pessoa aperta Enter no link "Pular para o conteúdo", então o foco vai para o `<main>`. Ao trocar de rota pelo menu, o foco também vai para o `<main>`.
- **AC-24** [manual] Dados o tema escuro e o claro, quando as telas Painel, Lançamentos, Orçamentos e Categorias são abertas, então texto e ícones com significado atingem contraste ≥ 4,5:1 (texto) e ≥ 3:1 (ícones, barras), incluindo o avatar de categoria com a cor `#eab308`.

### Estrutura, bundle e CI

- **AC-25** [CI] Dado o código depois do redesign, quando se busca `from 'recharts'` em `src/`, então só aparecem arquivos em `src/features/painel/charts/`.
- **AC-26** [CI] Dado o código depois do redesign, quando se busca `#[0-9a-fA-F]{3,8}\b`, `shadow-\[` ou `duration-\[` em `src/**/*.tsx`, então não há ocorrência (as cores de categoria vêm do banco por `style`).
- **AC-27** [CI] Dado `npm run build`, quando o relatório de bundle é gerado, então o chunk de entrada não contém o Recharts e não cresce mais que 15 kB gzip em relação à medição registrada antes da Fase 1.
- **AC-28** [CI] Dado o workflow de CI, quando ele roda, então `tsc -b` executa uma vez, a versão do Vercel CLI é fixa e o deploy continua só em push para `main`.
- **AC-29** [unit] Dados 3.000 lançamentos sintéticos em 12 meses e 15 categorias, quando `buildDashboardModel` + `buildInsights` rodam no Vitest (`node`), então terminam em menos de 100 ms.
- **AC-30** [CI] Dado `npm test`, quando os testes rodam, então todo teste que **cobre um critério de aceite** (AC-xx, UX-xx, H-xx) tem o ID no nome (ex.: `AC-10: janela inválida volta para 6`), e cada critério marcado [unit] ou [CI] tem ao menos um teste com o seu ID. Testes de funções de apoio que não cobrem um critério específico (formatação, mapeamento de erros, utilitários) não precisam de ID. _(Revisado em 2026-11-23: exigir ID em todo teste obrigaria a inventar critérios para utilitários.)_

## 6. Perguntas em aberto (para o usuário)

1. **Os layouts Comando, Fluxo e Atlas saem do produto?** Recomendação: sim. O painel principal absorve só o que a spec do `designer` mantiver (o calendário de gastos do Atlas é o candidato mais forte). Isso desbloqueia os itens 5 e P-03.
2. **12 meses é o teto da janela?** Recomendação: sim. Mais que isso pede agregação no banco (RPC) e um ADR.
3. **Testes automatizados de interface agora?** Os critérios AC-03 a AC-24 ficam como verificação manual até haver testes de componente/E2E. Recomendação: o `qa-engineer` propõe o ADR-0002 (Vitest browser mode + Playwright, ou jsdom + Testing Library) junto da Fase 1.

---

## 7. Situação em 2026-11-23

Entrega da branch `feat/design-system` (redesign "Régua", correções de dados, segurança e CI), revisada e aprovada. Os ADRs [0001](../adr/0001-design-system-e-redesign.md) e [0002](../adr/0002-design-system-regua.md) passaram a **Aceito**, com as decisões finais registradas neles. A estrutura resultante está em [`docs/ARQUITETURA.md`](../ARQUITETURA.md).

**Respostas às perguntas da seção 6:** (1) os labs saíram; só o calendário de gastos voltou, como card do painel. (2) 12 meses é o teto, e a janela ficou em 6/12 (sem a opção 3). (3) os testes de interface continuam fora desta entrega (ver pendências). Observação: o número "ADR-0002" sugerido na pergunta 3 acabou usado pelo design system "Régua"; o ADR de testes de interface vai ter o próximo número livre.

### Feito nesta entrega

| # | Item | Como ficou |
|---|---|---|
| 1 | Paginação (D-01) | `shared/lib/paginate.ts` + `listAllPages`; páginas de 1000 em ordem estável terminando em `id`; falha em qualquer página rejeita tudo. Testado (`paginate.test.ts`). |
| 2 | Error boundary + recarga de chunk (R-01) | Data router com `errorElement`, `app/route-error-boundary.tsx` e `app/chunk-reload.ts` (1 recarga automática a cada 15 s por aba); rewrite sem `/assets/`. |
| 3 | `keepPreviousData` + prefetch (P-01) | Nas consultas por mês e por intervalo; prefetch no hover/foco das setas e da grade do seletor de mês. |
| 4 | `update` em vez de `upsert` (D-02) | `updateTransaction` com `.update().eq('id').eq('user_id').single()`. |
| 5 | Painel consolidado, labs removidos (E-01, E-02, P-03) | `painel/hooks.ts`, `params.ts`, `detail.ts`, `ruler.ts`, `calendar.ts`, `links.ts`; `layouts/` e rotas apagados. |
| 6 | Dividir `dialog.tsx` + `Segmented` com teclado (E-03, E-04, A-01) | `field`, `input`, `select`, `control.ts`, `segmented` sobre ToggleGroup. |
| 7 | Tokens e fim do hex nos componentes (K-01, E-06) | Tokens do "Régua" em `src/index.css`; guarda automática AC-26 em `app/codebase-guards.test.ts`. |
| 8 | Invalidação ao excluir categoria (D-03) | Invalida `categories` e `budgets` (a FK de `transactions` é `restrict`, então lançamentos não mudam). |
| 9 | `usePrefersReducedMotion` (A-02) | `shared/hooks/use-prefers-reduced-motion.ts`, usado nos gráficos e na rolagem. |
| 10 | CI (C-01, C-02) | Vercel CLI com versão fixa, `tsc -b` uma vez (pelo `build`), actions fixadas por SHA, `permissions: contents: read`; guardas AC-28. |
| 12 | Primitivas compartilhadas (E-04) | `progress`, `skeleton`, `badge`, `sheet`, `tooltip`, `popover`, `category-avatar`, `delta`, `month-switcher`, `brand-mark`. |
| 13 | Filtros de Lançamentos na URL (A-05) | `?tipo`, `?categoria`, `?busca` (`lancamentos/filters.ts`); também `?tipo` em Categorias e `?categoria` em Orçamentos. |
| 15 | Pular para o conteúdo + foco no `<main>` (A-03) | No `app-shell.tsx`. |
| 16 | README e `ARQUITETURA.md` (C-04) | README lista as três migrações na ordem; `ARQUITETURA.md` reescrito para o código atual. |
| 17 (parte) | `BrandMark` em `shared/components` (E-05) | Feito. |
| 19 | KPI "Metas" sem âmbar fixo; contraste do avatar (K-02, A-04) | Tom pelo status da meta; avatar com a paleta de 8 cores que passa 3:1 nos dois temas. |
| — | Segurança (fora deste backlog; ver `2026-11-seguranca.md`) | CSP e cabeçalhos no `vercel.json` (CSP aplicada direto, sem Report-Only, por decisão do usuário); `public/theme-init.js` no lugar do script inline; migração `20261123120000_hardening.sql` (`anon` sem privilégios, `search_path = ''`); cache limpo no `SIGNED_OUT`. |

### Continua pendente

| Item | Achado | Situação |
|---|---|---|
| **Chunk do painel acima de 500 kB** | P-02, C-03 | O `vite build` avisa que o chunk do painel passa de 500 kB (o Recharts fica nele, como planejado, mas pesa). Não há relatório nem limite de bundle no CI (AC-27 não automatizado). Próximo passo: medir com um visualizador de bundle e avaliar dividir os gráficos em chunks próprios (`lazy()` por card) antes de mexer no `manualChunks`. |
| **Testes de componente e E2E** | T-02 | Continuam sem jsdom, Testing Library ou Playwright. Os critérios marcados [manual] (AC-03, AC-04, AC-06, AC-08 a AC-24) foram verificados à mão. Precisa de um ADR novo (próximo número livre), proposto pelo `qa-engineer`. |
| Cobertura com limite | T-03 | `vitest.config.ts` sem `coverage`. Os testes novos já levam o ID do critério (T-01 resolvido nos arquivos novos). |
| **Dependabot** | Auditoria de segurança | Não existe `.github/dependabot.yml`. As actions estão fixadas por SHA, então sem Dependabot elas não recebem correções sozinhas; o mesmo vale para os pacotes npm (as três libs Radix estão com versão exata). |
| **Regras do environment `production`** | Auditoria de segurança | O deploy usa o environment `production` do GitHub, mas as regras de proteção (revisores obrigatórios, só a branch `main`) não foram configuradas nem verificadas. É configuração do repositório no GitHub, feita pelo dono. |
| `subtractMoney` | D-04 | Não foi criado. As telas que subtraíam `number` foram apagadas e as contas novas do painel usam `toCents` nos `.ts` puros; falta a função no domínio para fechar a regra. |
| `Intl.DateTimeFormat` reaproveitado | P-04 | `formatShortDate` (`src/domain/month.ts:70`) ainda cria um formatador a cada chamada. |
| Índices nas FKs `category_id` | C-05 | A migração de hardening não os incluiu. Ficam para a próxima migração de schema. |
| Texto no singular | Voz "vocês" | `src/features/lancamentos/transaction-dialog.tsx:185` ainda diz "Crie uma em"; o padrão é o plural ("Criem uma em"). |
