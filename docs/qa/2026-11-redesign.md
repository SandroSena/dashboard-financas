# QA: redesign "Régua" (branch `feat/design-system`, novembro de 2026)

Validação dos critérios de `docs/auditoria/2026-11-arquitetura.md` (AC-01 a AC-30), das specs de `docs/design/telas/*.md` (UX-xx) e dos requisitos de `docs/auditoria/2026-11-seguranca.md` (H-01 a H-04). A execução foi feita em 2026-11-23 sobre as mudanças ainda não commitadas contra a `main`.

Legenda da coluna **Como**:

- **unit**: teste Vitest (ambiente `node`) com o ID no nome.
- **guarda**: teste Vitest que lê código e configuração como texto (`src/app/codebase-guards.test.ts`).
- **inspeção**: conferido à mão no código ou no build nesta rodada, com o resultado descrito.
- **manual**: depende do navegador com login. Está **pendente** e **não conta como aprovado**.

## 1. Resultados reais

Os comandos rodaram a partir de `D:\Repositorios\outros\dashboard-financas`, com o D maiúsculo.

| Comando | Resultado |
|---|---|
| `npm run check` (antes dos testes novos) | lint: 0 erros e 6 avisos (`only-export-components`, `incompatible-library`, `refs`). `tsc -b` ok. Vitest: **30 arquivos, 247 testes, 247 passaram, 0 falharam, 0 pulados** |
| `npm run check` (com os testes novos do QA) | lint: 0 erros e 6 avisos. `tsc -b` ok. Vitest: **34 arquivos, 269 testes, 269 passaram, 0 falharam, 0 pulados** |
| `npm run check` e `npm run build`, rodados de novo depois das mudanças de texto (`transaction-dialog.tsx:185` "Criem uma em", `spending-pace.tsx:322` "Cliquem/Toquem de novo para ver o dia" e docs) | lint com 0 erros e 6 avisos, `tsc -b` ok, **34 arquivos e 269 testes: 269 passaram**. Build ok, entrada com 123,30 kB gzip (igual) |
| `npm test` e `npm run check`, na revalidação de AC-12 e AC-30 (com os testes de AC-27, AC-30 e o novo de AC-12) | **35 arquivos e 274 testes: 274 passaram, 0 falharam, 0 pulados**. Lint com 0 erros e 6 avisos, `tsc -b` ok |
| `npx vitest run`, repetido 3 vezes | 269 de 269 nas 3 execuções, sem instabilidade |
| `npm run build` | ok, em 589 ms. Aviso de chunk acima de 500 kB: `dashboard-page` tem 546 kB, ou 154,71 kB gzip, e o Recharts está nele |

**Testes novos (só código de teste, 27 testes em 5 arquivos):**

| Arquivo | IDs cobertos |
|---|---|
| `src/app/codebase-guards.test.ts` | AC-07, AC-25, AC-26, AC-27 (grafo de imports estáticos de `src/main.tsx` não chega ao `recharts`), AC-28, H-01 |
| `src/shared/lib/query-keys.test.ts` | AC-04 (a invalidação por prefixo alcança metas e histórico) |
| `src/features/orcamentos/remaining.test.ts` | AC-05 (Orçamentos, resumo, painel e folha de categoria) |
| `src/features/painel/compare-average.test.ts` | AC-12 (revisado), 4 testes, entre eles o do dia que não existe num mês curto |
| `src/app/criteria-coverage.test.ts` | AC-30 (revisado): cada AC [unit]/[CI] da auditoria tem teste com o seu ID |

**Prova de que os testes falham** (cópia exata em `%TEMP%`, mutação, teste vermelho, cópia de volta e `cmp` sem diferença):

| Arquivo | Mutação | Resultado | Restaurado idêntico |
|---|---|---|---|
| `src/features/orcamentos/model.ts:121` | `limitCents - spentCents` virou `limitCents - spentCents - 1` | 2 testes de AC-05 ficaram vermelhos | sim |
| `vercel.json` | rewrite `/((?!assets/).*)` virou `/(.*)` | o teste de AC-07 ficou vermelho | sim |
| `src/app/app-shell.tsx` | import estático de `painel/charts/sparkline` no fim do arquivo | o teste de AC-27 ficou vermelho | sim |
| `src/features/painel/performance.test.ts` (nome do teste) | `AC-29:` virou `AC-2x:` | o teste de AC-30 ficou vermelho, acusando o AC-29 | sim |

Duas mutações anteriores no mesmo `model.ts` (`toCents(x)` → `x * 100`) não derrubaram nenhum teste. Com os valores escolhidos, 10,01 × 100 dá exatamente 1001, então elas não eram mutações de verdade. A troca de `toCents(x)` por `x * 100` ficou sem prova; quem fez a prova foi a mutação off-by-one acima. O arquivo foi restaurado e conferido com `cmp` depois de cada tentativa.

**Fumaça sem login:**

- `vite` na porta 5199, porque a 5173 já estava ocupada por outro processo, que não foi mexido:
  - `/entrar`, `/criar-conta`, `/painel` e um caminho inexistente respondem 200 com `text/html`.
  - `/theme-init.js` responde 200.
  - O grafo de módulos foi percorrido a partir de `/src/main.tsx`: **152 módulos** (126 de `src/`), todos 200 e nenhum 500.
- `vite preview` (porta 5198):
  - `/entrar` e `/painel` respondem 200 com o `index.html`.
  - `/assets/index-*.js` responde 200 com JavaScript.
  - **`/assets/inexistente.js` responde 200 com o `index.html`.** É o esperado no preview: ele faz o fallback de SPA e **não aplica a rewrite da Vercel**. A regra da Vercel (`/((?!assets/).*)`) exclui `/assets/` e está coberta pelo teste de AC-07. O 404 real só pode ser confirmado depois do deploy (seção 4).
- Os dois servidores foram encerrados no final.

## 2. Matriz de rastreabilidade: auditoria (AC-01 a AC-30)

| ID | Critério (resumo) | Como | Evidência | Resultado |
|---|---|---|---|---|
| AC-01 | 1.500 lançamentos chegam ao modelo e os totais batem em centavos | unit | `shared/lib/paginate.test.ts` › "AC-01: junta 1.500 linhas em duas páginas de 1000…"; `painel/performance.test.ts` › "AC-01: os totais do mês batem…"; `painel/model.test.ts` › "AC-01: …" | ✅ |
| AC-02 | 2ª página falha → `DataError`, sem total parcial | unit | `paginate.test.ts` › "AC-02: segunda página falha, então DataError… e nenhum dado parcial". O repository usa `listAllPages` (`transactions-repository.ts:39,56`) | ✅ |
| AC-03 | editar um registro excluído → "Registro não encontrado." e ele não volta | unit + manual | `shared/lib/supabase.test.ts` › "AC-03: update sem linha (PGRST116)…". Inspeção: os lançamentos usam `.update().single()`, sem upsert | ✅ unit / ⏳ manual |
| AC-04 | excluir categoria → a meta some sem recarregar | unit + inspeção + manual | `shared/lib/query-keys.test.ts` › "AC-04: invalidar budgetsAll alcança as metas de qualquer mês…". Inspeção: `categorias/hooks.ts:41-44` invalida `categories` e `budgetsAll`, e a FK `budgets.category_id` tem `on delete cascade` | ✅ unit / ⏳ manual |
| AC-05 | limite R$ 100,10 e gasto R$ 100,10 → restante exatamente 0, "Restam R$ 0,00" | unit | `orcamentos/remaining.test.ts` › "AC-05: em Orçamentos, restante é exatamente 0…" e mais 5 testes. Não existe `subtractMoney`: a regra é `toCents(limite) - toCents(gasto)` | ✅ |
| AC-06 | chunk sumido → recarrega uma vez; se falhar de novo, tela "Recarregar" | unit + manual | `app/chunk-reload.test.ts` (describe "AC-06: recarga automática…", 7 testes). Inspeção: `route-error-boundary.tsx:83` tem "Recarregar" e não mostra stack | ✅ unit / ⏳ manual |
| AC-07 | `/assets/inexistente.js` → 404 na Vercel | guarda + pós-deploy | `codebase-guards.test.ts` › "AC-07: /assets/inexistente.js não é reescrito…" e "AC-07: rotas do app continuam caindo no index.html". No preview a resposta é 200 (fallback), como esperado | ✅ regra / ⏳ pós-deploy |
| AC-08 | trocar de mês mantém o conteúdo, sem esqueleto | inspeção + manual | `keepPreviousData` em `lancamentos/hooks.ts:21,55` e `orcamentos/hooks.ts:16` | ⏳ manual |
| AC-09 | foco ou hover na seta faz o prefetch | inspeção + manual | `month-switcher.tsx:72-73,116-117,211-215` chama `onPrefetch` | ⏳ manual |
| AC-10 | `?janela=12` vale, `7`/`abc` voltam a 6, `historyBounds('2026-11',12).start = 2025-12-01` | unit | `painel/params.test.ts` › "AC-10: ?janela=12 é aceita; 7, 3, abc ou vazia voltam para 6"; `model.test.ts` › "AC-10: historyBounds com janela de 12…" | ✅ |
| AC-11 | link com mês, janela e comparação reabre igual | unit + manual | `params.test.ts` › "AC-11 / UX-21: ?comparar=media é lida…"; `use-search-param.test.ts` › "AC-11: grava o parâmetro sem perder ?mes" | ✅ unit / ⏳ manual |
| AC-12 | média dos até 3 meses anteriores com lançamento; sem nenhum, variação `null` e "Sem meses anteriores para a média" (**revisado em 2026-11-23**) | unit | `painel/compare-average.test.ts` › "AC-12: a média usa só ago. e out.…", "AC-12: sem mês anterior com movimento, a variação é null…", "AC-12: mês com só receita conta…" e "AC-12: no acumulado por dia, o dia que não existe num mês curto usa o último dia…"; também `insights.test.ts` › UX-21/UX-22 | ✅ |
| AC-13 | ativar uma categoria abre a folha completa e grava `?categoria=` | unit + manual | `painel/detail.test.ts` › "UX-26 / AC-13: total, variação, participação, meta…" | ✅ unit / ⏳ manual |
| AC-14 | Esc, Fechar ou Voltar fecham a folha, tiram o parâmetro e devolvem o foco | unit + manual | `use-search-param.test.ts` › "AC-14: null remove o parâmetro…"; `shared/lib/return-focus.test.ts` (describe "…(AC-14, UX-28)") | ✅ unit / ⏳ manual |
| AC-15 | id fora das categorias do usuário → `null` e a folha não abre | unit + manual | `detail.test.ts` › "AC-15 / UX-30: id que não está nas categorias do usuário devolve null"; `params.test.ts` › "AC-15 / UX-29…"; `filters.test.ts` › "AC-15: …" | ✅ unit / ⏳ manual |
| AC-16 | B abre um link de A e nada de A aparece | manual | RLS e AC-15. Precisa de duas contas | ⏳ manual |
| AC-17 | "Ver em Lançamentos" → `mes`, `tipo` e `categoria` aplicados e mantidos ao recarregar | unit + manual | `painel/links.test.ts` › "AC-17: \"Ver em Lançamentos\" leva mês, tipo e categoria"; `filters.test.ts` › "AC-17: …" (2 testes) | ✅ unit / ⏳ manual |
| AC-18 | mês sem gastos → vazio da spec, nada clicável | manual | — | ⏳ manual |
| AC-19 | alternar gráfico/tabela, com teclado | manual | — | ⏳ manual |
| AC-20 | `Segmented`: só a opção ativa recebe foco e as setas mudam a opção | unit + manual | `lancamentos/form-defaults.test.ts` › "AC-20: setas andam e dão a volta; Home/End…" | ✅ unit / ⏳ manual |
| AC-21 | tooltip do KPI abre no foco, usa `aria-describedby` e fecha com Esc | manual | Inspeção: `shared/ui/tooltip.tsx` (Radix, descrição) | ⏳ manual |
| AC-22 | movimento reduzido → nada anima (prop do gráfico) | inspeção + manual | `charts/spending-pace.tsx:80` e `charts/evolution-chart.tsx:54`: `isAnimationActive: !reducedMotion`; o sparkline usa `false` | ✅ inspeção / ⏳ manual |
| AC-23 | "Pular para o conteúdo" e foco no `<main>` ao trocar de rota | inspeção + manual | `app-shell.tsx:92` (link), `:143` (`tabIndex={-1}`) | ⏳ manual |
| AC-24 | contraste ≥ 4,5:1 e ≥ 3:1 nos dois temas | unit + manual | `category-colors.test.ts` › "AC-24: nenhuma cor antiga reservada…" e "AC-24: o avatar usa o token do slot… (#eab308 vira Ouro)" | ✅ unit / ⏳ manual |
| AC-25 | `recharts` só em `painel/charts/` | guarda + inspeção | `codebase-guards.test.ts` › "AC-25: só src/features/painel/charts/ importa de 'recharts'". O grep acha 3 arquivos, todos em `charts/` | ✅ |
| AC-26 | nenhum hex, `shadow-[` ou `duration-[` em `.tsx` | guarda + inspeção | `codebase-guards.test.ts` › "AC-26: nenhum .tsx tem hex cru…". Grep: 0 ocorrências | ✅ |
| AC-27 | chunk de entrada sem Recharts e com no máximo +15 kB gzip | guarda + inspeção | Entrada `index-*.js` com **123,30 kB gzip**. A `main`, compilada nesta rodada com o mesmo toolchain, tinha **134,35 kB**: **−11,05 kB**. O Recharts só aparece em `dashboard-page` (marcador `recharts-wrapper`). O teste `codebase-guards.test.ts` › "AC-27: a partir de src/main.tsx, nenhum import estático chega ao recharts" guarda a parte do Recharts. A parte do tamanho é medida no build. Ver a observação O-01 | ✅ |
| AC-28 | `tsc -b` uma vez no CI, Vercel CLI fixa, deploy só em push na `main` | guarda + inspeção | `codebase-guards.test.ts` › 3 testes "AC-28: …". `vercel@66.6.0` e `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`. Ver a observação O-02 | ✅ |
| AC-29 | 3.000 lançamentos → modelo + insights em menos de 100 ms | unit | `painel/performance.test.ts` › "AC-29: 3.000 lançamentos em 12 meses e 15 categorias…", verde nas 3 execuções | ✅ |
| AC-30 | **revisado:** todo teste que cobre um critério tem o ID, e cada AC [unit]/[CI] tem ao menos um teste com o seu ID | guarda | `src/app/criteria-coverage.test.ts` › "AC-30: cada critério [unit] ou [CI] tem ao menos um teste com o seu ID no nome". Verde, e a mutação provou que ele falha. Testes de apoio sem ID (138) ficaram fora do critério revisado | ✅ |

**Cobertura do AC-30 revisado (AC [unit]/[CI] → teste com o ID):**

| AC | Teste |
|---|---|
| AC-01 | `shared/lib/paginate.test.ts` › "AC-01: junta 1.500 linhas…" |
| AC-02 | `paginate.test.ts` › "AC-02: segunda página falha, então DataError…" |
| AC-05 | `orcamentos/remaining.test.ts` › "AC-05: em Orçamentos, restante é exatamente 0…" |
| AC-10 | `painel/params.test.ts` › "AC-10: ?janela=12 é aceita…" |
| AC-12 | `painel/compare-average.test.ts` › "AC-12: a média usa só ago. e out.…" |
| AC-15 | `painel/detail.test.ts` › "AC-15 / UX-30: id que não está nas categorias…" |
| AC-25 | `app/codebase-guards.test.ts` › "AC-25: só src/features/painel/charts/ importa de 'recharts'" |
| AC-26 | `codebase-guards.test.ts` › "AC-26: nenhum .tsx tem hex cru…" |
| AC-27 | `codebase-guards.test.ts` › "AC-27: a partir de src/main.tsx…" (**novo**) |
| AC-28 | `codebase-guards.test.ts` › "AC-28: o job de checagem roda a checagem de tipos uma vez só…" |
| AC-29 | `painel/performance.test.ts` › "AC-29: 3.000 lançamentos…" |
| AC-30 | `app/criteria-coverage.test.ts` › "AC-30: cada critério [unit] ou [CI]…" (**novo**) |

### 2.1 AC-12 e AC-30: revisados em 2026-11-23

- Os dois critérios foram revisados em `docs/auditoria/2026-11-arquitetura.md`.
  - **AC-12** passou a seguir UX-21/UX-22: a média dos até 3 meses anteriores com lançamento e o texto "Sem meses anteriores para a média". A divergência da rodada anterior está resolvida.
  - **AC-30** passou a exigir o ID só nos testes que cobrem um critério, e pelo menos um teste por AC [unit]/[CI].
- Faltava teste para AC-27 e AC-30, e os dois foram escritos nesta rodada.

### 2.2 Observações (não reprovam critério)

- **O-01 (bundle):** o chunk de entrada encolheu, mas a carga inicial cresceu.
  - Carga inicial = entrada + `modulepreload` do `index.html`.
  - Antes, na `main`: 134,35 + 91,14 + 15,70 = **241,19 kB gzip**.
  - Agora: 123,30 + 127,00 + 38,17 = **288,47 kB gzip**, ou **+47,28 kB**.
  - O Zod agora está no chunk de entrada. Radix (popper, tooltip), Supabase e Sonner foram para chunks pré-carregados.
  - O AC-27 mede só o chunk de entrada, então passa. Fica para o `architect` decidir se o critério deve medir a carga inicial.
- **O-02 (CI):** no job `check`, o `tsc -b` roda uma vez só. No push para a `main`, o job `deploy` roda `vercel build --prod`, que executa `npm run build` e portanto `tsc -b` de novo. Isso não afeta PRs.
- **O-03:** o `dashboard-page` tem 154,71 kB gzip, acima do aviso de 500 kB minificado do Vite. É lazy e não está no caminho de entrada.

## 3. Matriz: UX principais do painel e de lançamentos

| ID | Resumo | Como | Evidência | Resultado |
|---|---|---|---|---|
| UX-10 / UX-14 | verbo e saldo no `h1`; passou da receita | unit + manual | `insights.test.ts` › "UX-10 / UX-14: …"; `ruler.test.ts` › "UX-14: …" | ✅ unit / ⏳ animação manual |
| UX-11 | movimento reduzido: nada anima | manual | AC-22 | ⏳ |
| UX-12 / UX-13 | cor e veredito da régua | unit | `ruler.test.ts` › "UX-12: …", "UX-13: …" | ✅ |
| UX-15 / UX-16 / UX-17 | teclado na régua: → anda, Enter abre o dia, Esc volta | unit + manual | `ruler.test.ts` › "UX-15: …" (2), "UX-16 / UX-17: …"; `params.test.ts` › "UX-16: …" | ✅ unit / ⏳ manual |
| UX-18 / UX-19 / UX-20 | tooltip, clique e legenda do Ritmo | unit + manual | `insights.test.ts` › "UX-18: …" | ✅ dados / ⏳ manual |
| UX-21 / UX-22 | comparar com a média | unit + manual | `insights.test.ts` (4 testes) e `compare-average.test.ts` | ✅ unit / ⏳ URL sem nova entrada no histórico |
| UX-23 / UX-24 | cards levam a Lançamentos e Orçamentos com filtros | unit + manual | `links.test.ts` › "UX-23: …", "UX-24: …" | ✅ unit / ⏳ manual |
| UX-26 a UX-30 | folha de categoria: abrir, mini-gráfico, fechar, link direto, categoria excluída | unit + manual | `detail.test.ts`, `params.test.ts`, `return-focus.test.ts` | ✅ unit / ⏳ manual |
| UX-31 / UX-33 | "Outras (n)" e "Nova neste mês" | unit | `insights.test.ts` › "UX-31: …", "UX-33: …" | ✅ |
| UX-36 / UX-37 | calendário: ↓ vai +7, dias futuros desabilitados | unit + manual | `calendar.test.ts` e `model.test.ts` › "UX-36: …", "UX-37: …" | ✅ unit / ⏳ manual |
| UX-38 / UX-39 / UX-40 | ordem das metas, recentes, maior gasto | unit + manual | `model.test.ts` › "UX-38", "UX-39"; `detail.test.ts` › "UX-16 / UX-40" | ✅ unit / ⏳ manual |
| UX-42 a UX-46 | estados vazio, sem categorias, erro, erro parcial e carregando | manual | — | ⏳ |
| UX-47 | tabela com `<caption>` | manual | AC-19 | ⏳ |
| UX-48 | ordem do Tab segue a visual, sem `order-*` | inspeção + manual | grep `order-*` e `grid-row` em `.tsx`: 0 ocorrências | ✅ inspeção / ⏳ manual |
| UX-49 | 375px: sem rolagem horizontal, alvos de toque ≥ 44px | manual | — | ⏳ |
| UX-50 a UX-54 | filtros de Lançamentos pela URL, limpar filtros, busca, vazio | unit + manual | `lancamentos/filters.test.ts` › "UX-50: …" a "UX-54: …" | ✅ unit / ⏳ manual (debounce de 150 ms, anúncio) |
| UX-55 / UX-57 | categoria padrão; toast "Ver outubro" | unit + manual | `form-defaults.test.ts` › "UX-55: …", "UX-57: …" | ✅ unit / ⏳ manual |
| UX-56 / UX-58 / UX-60 / UX-61 | erro do Valor, Desfazer, botões no Tab, falha de carga | manual | — | ⏳ |
| UX-59 | 375px: tocar na linha abre a edição | unit + manual | `filters.test.ts` › "UX-59: rótulo da linha no celular…" | ✅ rótulo / ⏳ manual |

## 4. Segurança

| ID | Requisito | Como | Resultado |
|---|---|---|---|
| H-01 | CSP sem `unsafe-inline` em `script-src`, demais headers e nenhum script inline | guarda | ✅ `codebase-guards.test.ts` › "H-01: a CSP vale para todas as rotas…" e "H-01: o index.html não tem script inline". A CSP é aplicada direto, sem `Report-Only`, por decisão do usuário. Falta conferir o console depois do deploy (manual, seção 5.8) |
| H-02 | revoke do `anon` nas tabelas e default privileges (com V-02) | inspeção + manual | ✅ inspeção de `supabase/migrations/20261123120000_hardening.sql`, já aplicada em produção em 2026-11-23 sem erros, (revoke nas 3 tabelas, default privileges de tables, sequences e functions, `for role postgres revoke execute… from public`, rollback no topo). ⏳ confirmação em produção (seção 5.7) |
| H-03 | `search_path = ''` nas 4 funções | inspeção + manual | ✅ inspeção: os corpos usam `public.` qualificado e literais de enum sem cast por nome. ⏳ confirmação em produção (seção 5.7) |
| H-04 | CI com permissões de leitura, actions por SHA, CLI fixa, token por `env` | inspeção + guarda | ✅ `permissions: contents: read`, SHAs v5.1.0 e v5.0.0, `vercel@66.6.0`, `VERCEL_TOKEN` em `env` |

## 5. Lista de verificação manual (pendente)

Preparação:

- Rode `npm run dev` e entre com uma conta sua, de preferência uma criada só para testes.
- Por decisão do usuário, não haverá Playwright nem testes de tela agora. Estes itens ficam como verificação manual.
- No DevTools, use o modo de dispositivo com 375 × 812 para os itens de celular.
- No painel Rendering, use "Emulate CSS prefers-reduced-motion: reduce" para os itens de movimento.
- O tema troca pelo menu da conta.
- Marque cada linha com ✅ ou ❌ e anote o que viu.

### 5.1 Entrar e criar conta

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Sem sessão, abra `/painel?mes=2026-09`, entre com sucesso | Volta para `/painel?mes=2026-09` | UX-94 |
| 2 | Abra `/entrar` no desktop com o app no tema claro | Painel esquerdo escuro, régua enche uma vez, foco no e-mail | UX-90 |
| 3 | Mesmo passo com movimento reduzido | Régua já cheia, sem animação | UX-91 |
| 4 | Senha errada → "Entrar" | "E-mail ou senha não conferem…" acima do botão; e-mail mantido; senha vazia e com foco | UX-92 |
| 5 | E-mail inválido → enviar | "Informem um e-mail válido." embaixo do campo, `aria-invalid="true"` | UX-93 |
| 6 | `/entrar` a 375px | Só o formulário, campos de 48px, régua compacta abaixo | UX-97 |

### 5.2 Navegação (shell)

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Logo após carregar, aperte Tab uma vez, depois Enter | Aparece "Pular para o conteúdo"; o foco vai para o `<main>` | AC-23, UX-07 |
| 2 | Troque de rota pelo menu | O foco vai para o `<main>`; o link ativo tem `aria-current="page"` e mantém `?mes=` | AC-23, UX-01 |
| 3 | Com o foco fora de campos, aperte N; depois, num campo de texto, aperte N | Abre "Novo lançamento"; no campo, só digita a letra | UX-02, UX-03 |
| 4 | Clique no nome do mês; use as setas, Enter e Esc | Popover com 12 meses, setas movem, Enter escolhe, Esc fecha e **o foco volta ao botão** | UX-04 |
| 5 | A 375px, role até o fim | Último item visível acima da barra de baixo; destinos ≥ 48px | UX-06, UX-09 |
| 6 | Teste tudo nos temas escuro e claro | Texto legível (≥ 4,5:1), ícones e barras visíveis (≥ 3:1), avatar "Ouro" legível | AC-24 |

### 5.3 Painel

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Abra um mês com dados | `h1` "Sobram R$ …", régua enche ~900 ms, número conta | UX-10 |
| 2 | Com movimento reduzido, abra e troque de mês | Nenhum gráfico, régua ou card anima | AC-22, UX-11 |
| 3 | Passe o mouse ou foque "Mês anterior" e clique, com a aba Network aberta | Ao trocar, nenhuma requisição nova de `transactions` | AC-09 |
| 4 | Troque para um mês sem cache (Network com "Slow 3G") | Conteúdo anterior a 60% com `aria-busy="true"` e barra fina, sem esqueleto | AC-08, UX-46 |
| 5 | Abra `/painel?mes=2026-11&janela=12&comparar=media` em outra aba | Mesmo mês, janela 12 e "Média de 3 meses" | AC-11 |
| 6 | Escolha "Média de 3 meses" e aperte Voltar do navegador | A URL troca sem nova entrada no histórico (Voltar sai da página anterior) | UX-21 |
| 7 | Foque a régua, aperte → 3 vezes, Enter, depois Esc | Cursor anda e lê "Até 12 de nov.…", Enter abre a folha do dia (`dia=` na URL), Esc volta para hoje | UX-15–17 |
| 8 | Em "Para onde foi", ative uma categoria com clique, Enter e Espaço | Abre a folha com total, variação, barras, meta e lançamentos; URL com `?categoria=` | AC-13, UX-26 |
| 9 | Na folha, feche com Esc, com Fechar, com o véu e com o Voltar do navegador | Fecha, `?categoria=` sai da URL, **o foco volta à linha que abriu** | AC-14, UX-28 |
| 10 | Na folha, clique "Ver em Lançamentos", depois recarregue (F5) | `/lancamentos?mes=…&tipo=…&categoria=<id>` com o tipo e o chip já aplicados, mantidos depois do F5 | AC-17 |
| 11 | Clique no card Gastos e no card Metas (sem metas) | Vai para `/lancamentos?mes=…&tipo=gastos` e para `/orcamentos?mes=…` | UX-23, UX-24 |
| 12 | Abra um link com `?categoria=<id de categoria excluída>` | A folha não abre, o parâmetro sai, aparece "Essa categoria não existe mais." | AC-15, UX-30 |
| 13 | Com a conta B, abra um link da conta A com `?categoria=<id de A>` | Nada de A aparece (nome, valor, lançamento) | AC-16 |
| 14 | Abra um mês sem gastos | Composição mostra o vazio; nenhum item clicável | AC-18, UX-42 |
| 15 | Em cada gráfico, use "Ver tabela" pelo teclado (Tab, setas, Espaço) | `<table>` com `<caption>` e os mesmos números do gráfico | AC-19, UX-47 |
| 16 | Tab até um `Segmented` (janela, gráfico/tabela), use as setas, **Tab** e depois **Shift+Tab** | Só a opção ativa recebe foco, as setas trocam, Tab sai do grupo e **Shift+Tab volta para a opção ativa, não para a primeira** | AC-20 |
| 17 | Foque o ícone de ajuda de um KPI pelo teclado e aperte Esc | Tooltip abre, é lido como descrição (`aria-describedby`) e fecha | AC-21 |
| 18 | Percorra o painel só com Tab | Ordem: cabeçalho → régua → KPIs → Para onde foi → Ritmo → Metas → Recentes → Dias do mês → Evolução → Destaques; anel visível | UX-48 |
| 19 | No calendário, foque o dia 12 e aperte ↓ | O foco vai para o dia 19; dias futuros sem foco; hoje com contorno | UX-36, UX-37 |
| 20 | Clique numa linha de Recentes e salve | Toast "Lançamento atualizado." e a linha pisca | UX-39 |
| 21 | Painel a 375px | Sem rolagem horizontal; toques ≥ 44px (calendário ≥ 40px); mesma ordem | UX-49 |
| 22 | Em DevTools, bloqueie a URL de `budgets` e recarregue | Os outros cards aparecem; Metas mostra "As metas não carregaram." com "Tentar de novo" | UX-45 |

### 5.4 Lançamentos

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Abra `/lancamentos?mes=2026-11&tipo=gastos&categoria=<id de Mercado>` | Segmentado em "Gastos", chip "Mercado ×", só Mercado de novembro | UX-50, UX-51 |
| 2 | Clique "Limpar filtros" | Chips somem, URL só com `mes` | UX-52 |
| 3 | Digite "farm" na busca | Em até 150 ms filtra sem diferenciar acento e maiúscula; contagem anunciada | UX-53 |
| 4 | Combine filtros sem resultado | "Nada com esses filtros" com "Limpar filtros" | UX-54 |
| 5 | Abra "Novo lançamento" | Foco no Valor; última categoria do tipo marcada | UX-55 |
| 6 | Envie com o Valor vazio | "Informem o valor." embaixo, `aria-invalid`, foco no campo | UX-56 |
| 7 | Em novembro, salve um lançamento com data de outubro | Toast "Lançamento adicionado em outubro." com "Ver outubro" | UX-57 |
| 8 | Exclua um lançamento e clique "Desfazer" | Ele volta com os mesmos dados | UX-58 |
| 9 | Desktop, só teclado: Tab até uma linha | Editar e Excluir 100% visíveis, com `aria-label` | UX-60 |
| 10 | Abra a edição numa aba, exclua o lançamento em outra aba e salve na primeira | "Registro não encontrado." e o lançamento **não** volta | AC-03 |
| 11 | No tipo do lançamento (Segmented do diálogo), use as setas, Tab e Shift+Tab | Igual ao item 16 do painel | AC-20 |
| 12 | Feche o diálogo com Esc e com "Cancelar" | **O foco volta ao botão ou à linha que abriu** | AC-14 |
| 13 | A 375px, toque numa linha | Abre a edição; "Excluir lançamento" no rodapé | UX-59 |
| 14 | Em DevTools, coloque a aba offline e recarregue a página | "Não foi possível carregar os lançamentos." com "Tentar de novo" | UX-61 |

### 5.5 Orçamentos

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Digite um valor no campo de uma categoria e aperte **Enter** | Salva; o campo mostra "500,00"; toast de sucesso | UX-82, UX-83 |
| 2 | Digite "abc" e aperte **Enter** | Erro embaixo do campo, `aria-invalid`, nada salvo | UX-82 |
| 3 | Apague o valor de uma meta existente e confirme | O botão vira "Remover"; toast "Meta removida." | UX-83 |
| 4 | Defina limite 100,10 e lance gastos que somem 100,10 | "Restam R$ 0,00" (não "Passou R$ 0,00"), status Estourada (≥ 100%) | AC-05 |
| 5 | Exclua (em Categorias) uma categoria com meta e volte sem recarregar | A meta sumiu de Orçamentos e do card do painel | AC-04 |
| 6 | Abra `/orcamentos?mes=…&categoria=<id>` | A linha rola para a vista, o campo tem foco | UX-86 |
| 7 | Em novembro sem metas, clique "Copiar metas de outubro" | Metas copiadas e o toast com a contagem | UX-84 |

### 5.6 Categorias

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Na grade de cores do diálogo, aperte → | Próxima cor marcada, prévia muda, "Cor: …" lido | UX-72 |
| 2 | Exclua uma categoria com lançamentos | Toast de bloqueio com "Ver lançamentos" → `/lancamentos?mes=…&categoria=…` | UX-75 |
| 3 | Feche o diálogo com Esc | O foco volta ao card que abriu | AC-14 |

### 5.7 Migração de hardening: confirmar em produção

A migração `20261123120000_hardening.sql` **já foi aplicada em produção** pelo usuário em 2026-11-23, sem erros. Falta só confirmar o efeito. As consultas abaixo **só leem** o catálogo: não criam objeto e não alteram dado. Rode-as no SQL Editor do projeto de produção:

```sql
-- 1) Privilégios do anon nas tabelas: todas as colunas devem dar false
select t,
       has_table_privilege('anon', t, 'select') as sel,
       has_table_privilege('anon', t, 'insert') as ins,
       has_table_privilege('anon', t, 'update') as upd,
       has_table_privilege('anon', t, 'delete') as del
from unnest(array['public.categories','public.transactions','public.budgets']) as t;

-- 2) As 4 funções: anon sem EXECUTE e search_path vazio
select p.oid::regprocedure,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       p.proconfig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('handle_new_user','enforce_transaction_category','enforce_budget_category','lock_category_identity');
-- esperado: anon_exec = false e proconfig = {search_path=""}

-- 3) Default privileges (H-02 e V-02): devem existir as entradas do postgres
--    para tabelas, sequências e funções sem o anon, e a de funções sem PUBLIC
select pg_get_userbyid(d.defaclrole) as dono, n.nspname as schema, d.defaclobjtype as tipo, d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
order by 1, 2, 3;
-- esperado: nenhuma ACL com "anon=" em schema public; na linha global (schema vazio) de tipo f, sem "=X/" para PUBLIC
```

Confira também pela API, com a chave anon pública de produção (o pedido não grava nada):

- Faça `GET {URL}/rest/v1/categories?select=id` com os headers `apikey` e `Authorization: Bearer <anon>`.
- O esperado é status 401 ou 403 com `"code":"42501"` (permission denied), e não `[]`.

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | Consultas 1 a 3 e o GET acima | Como nos comentários | H-02, H-03 |
| 2 | Crie uma conta nova em produção, com um e-mail seu de teste, e abra Categorias | As **12 categorias padrão** aparecem (9 de gasto, 3 de receita). Isso prova que o `handle_new_user` funciona com `search_path = ''`. Depois, apague a conta pelo painel do Supabase, se quiser | H-03 |
| 3 | Nessa conta, ou na sua, crie um lançamento e uma meta, renomeie uma categoria e tente trocar o tipo dela | O lançamento, a meta e a renomeação funcionam, porque os triggers continuam validando. A troca de tipo dá erro | H-03 |

### 5.8 Depois do deploy (produção)

| # | Passo | Esperado | ID |
|---|---|---|---|
| 1 | `curl -sI https://<domínio>/assets/inexistente.js` | `HTTP/2 404` (não o `index.html`) | AC-07 |
| 2 | `curl -sI https://<domínio>/painel` | 200 com `content-security-policy`, `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy`, `permissions-policy` | H-01 |
| 3 | Abra o app logado, navegue por todas as telas, abra diálogos, toasts e gráficos com o Console aberto | **Nenhuma** violação de CSP ("Refused to …"), nenhum erro de `theme-init.js` | H-01 |
| 4 | Com uma aba aberta antes do deploy, navegue para uma página ainda não visitada | O app recarrega uma vez sozinho. Se falhar de novo, mostra a tela "Recarregar" sem stack | AC-06 |

## 6. Veredito

**Approved, com ressalva.**

- Revalidação de AC-12 e AC-30, depois da revisão dos critérios: `npm test` deu **35 arquivos e 274 testes, 274 passaram, 0 falharam, 0 pulados**. `npm run check` também ficou verde (lint com 0 erros e 6 avisos, `tsc -b` ok).
- Todos os critérios [unit] e [CI] da auditoria têm teste com o seu ID, e passam.
- O AC-27 tem guarda para o Recharts e medição no build: a entrada caiu de 134,35 para 123,30 kB gzip.
- Nenhum bug de produto foi encontrado.
- **Ressalva:** os itens [manual] da seção 5 continuam **pendentes** e não contam como aprovados. Eles incluem a confirmação da migração em produção (5.7) e as verificações depois do deploy (5.8).
- As observações O-01 e O-02 ficam para o `architect`.
