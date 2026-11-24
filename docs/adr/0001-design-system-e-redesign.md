# ADR-0001: Design system e redesign do painel sobre a base atual (Radix + Tailwind + Recharts)

**Status:** Aceito (2026-11-23)
**Data:** 2026-11-23 (proposto e aceito no mesmo dia, após a implementação e as revisões de código, segurança e design)
**Decisores:** usuário (dono do produto), `architect`, `designer`, `frontend-engineer`

## Contexto

O usuário pediu um redesign do site com um design system novo e um painel "mais bonito e interativo". O `designer` está escrevendo o design system e as specs de tela em `docs/design/`. Este ADR trata só da parte técnica: onde cada peça mora, quais dependências entram e o que fica de fora.

Situação atual (ver a auditoria em `docs/auditoria/2026-11-arquitetura.md`):

- Os tokens já existem em `src/index.css` (`:root`, `.dark`, `@theme inline`, utilitários `surface`, `figure`, `eyebrow`, `numeral`). O `CLAUDE.md` define esse arquivo como fonte da verdade e proíbe um design system paralelo.
- As primitivas em `src/shared/ui` são poucas (`button`, `card`, `dialog`, `tabs`), e `dialog.tsx` também guarda `Field`, `TextInput`, `PasswordInput`, `NativeSelect` e `Segmented` (`src/shared/ui/dialog.tsx:88-191`).
- Há peças repetidas: 4 controles segmentados, 4 barras de progresso, 4 estados vazios e 2 módulos de gráfico com componentes de mesmo nome (`Sparkline` em `src/features/painel/charts.tsx:239` e em `src/features/painel/layouts/charts.tsx:78`).
- Faltam primitivas de sobreposição acessíveis (Tooltip, Popover). O painel interativo (drill-down por categoria, troca de janela, comparação) precisa delas.
- Dependências de UI já instaladas: `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`, `class-variance-authority`, `tailwind-merge`, `recharts` 3, `lucide-react` (`package.json:16-38`).
- O produto é um painel de finanças pessoais sem servidor. As prioridades em **Sobre o produto** são: gráficos acessíveis, cor nunca sozinha, estado na URL e dinheiro exato. Não há requisito de escala que justifique infraestrutura nova.

## Decisão

1. **Tokens continuam em `src/index.css`.** O `designer` propõe as mudanças em `docs/design/`, e o `frontend-engineer` as aplica nesse arquivo. Entram tokens para o que hoje está fixo nos componentes: elevação (`--shadow-popover`, `--shadow-raised`, `--shadow-fab`), duração de movimento (`--duration-fast|base|slow`), a cor de "Outros" nos gráficos (`--chart-other`) e o que mais a spec definir. Nenhum hex, sombra arbitrária ou duração fixa fica em `*.tsx`.
2. **Três camadas visuais, com a regra de imports `app → features → shared`:**
   - `src/shared/ui/`: **primitivas sem domínio** (não importam `@/domain`). Ficam aqui button, card, dialog, field, input, select (nativo), segmented, tooltip, popover, skeleton, badge, progress e sheet (variação de `AppDialog`).
   - `src/shared/components/`: **peças compostas com regra de apresentação do domínio**: `amount`, `money-text`, `feedback` (EmptyState, QueryError, Skeletons), `month-switcher`, `delta` (variação com seta e sinal), `category-avatar`, `brand-mark`, `page-header`, `theme-toggle`.
   - `src/features/painel/charts/`: **tudo o que importa `recharts`**. Recharts nunca é importado de `shared/` nem de `app/`, para continuar só no chunk lazy do painel.
3. **Dependências novas, todas da mesma família Radix que já está no projeto:**
   - `@radix-ui/react-tooltip`: dicas de KPI e de ícone, acessíveis por teclado e foco.
   - `@radix-ui/react-popover`: seletor de janela e comparação, filtros do painel.
   - `@radix-ui/react-toggle-group`: base do `Segmented`, com foco itinerante e setas do teclado. Substitui o `Segmented` atual, o `ViewToggle` e o `LayoutSwitcher`.
   - Instalar no mesmo major das que já existem, compatível com React 19.
4. **Ficam de fora (de propósito):**
   - `@radix-ui/react-select`: o `NativeSelect` reestilizado continua. É melhor no celular, já é acessível e não pesa nada. Só entra com spec do `designer` que o exija e uma emenda a este ADR.
   - Bibliotecas de animação (Motion/framer-motion, GSAP): o movimento é feito com CSS (keyframes já existentes + tokens de duração) e com a prop de animação do Recharts. Um hook `usePrefersReducedMotion` em `src/shared/hooks/` desliga a animação JS dos gráficos.
   - Trocar o Recharts, adicionar Storybook ou CSS-in-JS. As decisões visuais abertas são tratadas pelo `designer` em playground.
5. **Estado interativo que vale compartilhar fica na URL**, junto de `?mes=`: `?janela=3|6|12` (histórico), `?comparar=anterior|media` e `?categoria=<id>` (drill-down). Estado efêmero (gráfico/tabela, hover) fica em `useState`.
6. **Sem mudança de banco.** O redesign usa só os dados que os repositories já entregam. A única mudança de acesso a dados é a paginação de `listTransactionsBetween` (ver a auditoria, item D-01), que fica no repository e não muda o schema.

## Opções consideradas

### Opção A: estender a base atual (Radix por pacote + Tailwind + CSS + Recharts) (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa: os mesmos padrões de `dialog.tsx` e `tabs.tsx` |
| Custo | 3 pacotes pequenos. Tooltip e Popover compartilham o `react-popper`/`@floating-ui`, que entra uma vez só |
| Escalabilidade | Suficiente para o tamanho do app (5 telas) |
| Familiaridade do time | Alta, já é a stack em uso |

**Prós:** sem migração; acessibilidade (foco, Escape, colisão, ARIA) resolvida pela biblioteca; tokens continuam num lugar só.
**Contras:** cada primitiva continua sendo escrita à mão, com `cva`, no estilo do projeto.

### Opção B: adotar o shadcn/ui pela CLI

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média: gera arquivos que se sobrepõem a `button.tsx`, `dialog.tsx` e `tabs.tsx` |
| Custo | Reescrever as primitivas atuais e alinhar nomes de token; costuma trazer o pacote guarda-chuva `radix-ui` e `tw-animate-css` |
| Escalabilidade | Boa |
| Familiaridade do time | Média |

**Prós:** catálogo pronto.
**Contras:** o resultado é praticamente a Opção A com mais retrabalho, e o código gerado não segue os tokens próprios (`surface`, `figure`, `income/expense/warning`). **Rejeitada** pelo custo de migração sem ganho para o usuário.

### Opção C: biblioteca de animação (Motion)

**Prós:** transições de layout e contagem de números mais fáceis.
**Contras:** dezenas de kB a mais no chunk, para efeitos que o CSS já faz. Também fica mais difícil garantir `prefers-reduced-motion` em um lugar só. **Rejeitada.**

### Opção D: trocar o Recharts (visx, ECharts, Nivo)

**Prós:** mais controle (visx) ou mais tipos de gráfico (ECharts).
**Contras:** reescrever os gráficos que já funcionam e mudar o tamanho do bundle sem necessidade. O Recharts 3 já cobre linha, área, barra, rosca e a camada de acessibilidade. **Rejeitada.**

### Opção E: Tooltip e Popover escritos à mão

**Prós:** zero dependência.
**Contras:** posicionamento com colisão, foco, Escape, `aria-describedby` e toque no celular são fontes clássicas de bug de acessibilidade. **Rejeitada.**

## Análise de trade-offs

A Opção A troca um pouco de trabalho manual (escrever cada primitiva) por zero migração e coerência total com os tokens que já existem. As outras opções aceleram o catálogo, mas cobram em reescrita e em bundle, e este produto não precisa de um catálogo grande. Precisa de umas 8 peças bem feitas. O risco de manter o Recharts é o gráfico com teclado e movimento reduzido, que se resolve com props (`accessibilityLayer`, animação controlada pelo hook) e com a alternativa em tabela que já existe (`ViewToggle`).

## Consequências

- **Fica mais fácil:** criar telas com peças consistentes; garantir acessibilidade de teclado em controles segmentados e dicas; trocar o tema mudando só `src/index.css`; manter o Recharts fora do chunk inicial.
- **Fica mais difícil:** importar Recharts fora de `features/painel/charts/` (proibido por convenção; o `code-reviewer` checa).
- **Revisitar:** (1) se a spec pedir um seletor com busca (combobox), avaliar `@radix-ui/react-select` ou `cmdk` num ADR novo; (2) testes de componente/E2E para validar a interação automaticamente: precisa de ADR próprio (ver a auditoria, item T-02); (3) depois do redesign, atualizar `docs/ARQUITETURA.md` (seções "Estrutura de pastas", "Visual" e "Peças reutilizáveis").

## Ações

1. [x] Usuário decide se os layouts experimentais (Comando, Fluxo e Atlas) saem do produto (recomendação: sim, absorvendo no painel principal só o que a spec do `designer` mantiver).
2. [x] `designer`: spec dos tokens novos e das telas em `docs/design/`.
3. [x] `frontend-engineer`: instalar os 3 pacotes Radix, dividir `shared/ui/dialog.tsx` e criar as primitivas (blueprint na auditoria, fase 1).
4. [x] `frontend-engineer`: mover os gráficos para `features/painel/charts/` e criar `usePrefersReducedMotion`.
5. [x] `architect`: mudar este ADR para *Aceito* depois da aprovação do usuário e atualizar `docs/ARQUITETURA.md` ao fim da implementação.

## Decisões finais (implementação e revisões, 2026-11-23)

O que mudou ou foi fechado em relação ao texto acima. As decisões 1 a 4 e 6 valem como escritas; a 5 foi ajustada.

- **Labs removidos.** Comando, Fluxo e Atlas saíram do produto (pasta `layouts/`, rotas e `panelVariants`). Do Atlas, só o calendário de gastos voltou, como o card "Dias do mês" (`painel/calendar.ts`).
- **Janela 6/12 em `?janela`** (ajusta a decisão 5, que previa `3|6|12`). A janela vale para o gráfico de evolução e as tendências; padrão 6, teto 12. O painel sempre busca 12 meses numa só consulta e recorta a janela na tela, então trocar 6/12 não gera carga nova.
- **Comparação com a média de 3 meses com lançamento** (`?comparar=anterior|media`). A média usa até os 3 meses anteriores ao mês aberto **que tiveram lançamento**: meses vazios não entram como zero. Sem nenhum mês com lançamento, não há comparação e a tela diz "Sem meses anteriores para a média".
- **Folhas na URL**: além de `?categoria=<id>`, entrou `?dia=AAAA-MM-DD` (folha do dia). Só uma folha por vez; abrir cria histórico (o "Voltar" fecha).
- **Ordem única do DOM no painel**: a mesma ordem de leitura e de Tab em todas as larguras, sem `order-*`; só o número de colunas muda (1, 2 no `lg`, 12 no `xl`).
- **Libs Radix**: `@radix-ui/react-tooltip`, `@radix-ui/react-popover` e `@radix-ui/react-toggle-group` instaladas com **versão exata** no `package.json` (sem `^`), por supply chain. Nenhuma outra dependência de UI entrou; `@radix-ui/react-select` e bibliotecas de animação continuam de fora.
- **CSP aplicada direto**, sem passar por `Content-Security-Policy-Report-Only`, por decisão do usuário. Junto vieram `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` no `vercel.json`, e o script de tema saiu do `index.html` para `public/theme-init.js` (sem script inline).
- **`search_path = ''` nas funções**: a migração `20261123120000_hardening.sql` fixa o `search_path` vazio nas quatro funções (as funções já qualificam os nomes com `public.`) e tira os privilégios do papel `anon`. Não mudou o schema de dados (decisão 6 continua valendo).
- A rewrite do `vercel.json` passou a ignorar `/assets/`, e o `RouteErrorBoundary` recarrega uma vez em falha de chunk (auditoria R-01).

Estrutura resultante: `docs/ARQUITETURA.md`. Pendências que sobraram: `docs/auditoria/2026-11-arquitetura.md`, seção "Situação em 2026-11-23".
