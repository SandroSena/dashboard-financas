# Design system: "Régua"

Fonte da verdade dos tokens: **`src/index.css`**. Este documento explica as decisões e traz, na seção 9, o bloco pronto para o `frontend-engineer` aplicar. Não existe `tokens.json` nem pasta `design-system/` neste projeto.

Specs de tela: `docs/design/telas/` (painel, lançamentos, categorias, orçamentos, login/cadastro, shell). Decisão registrada em `docs/adr/0002-design-system-regua.md`.

---

## 1. Direção visual

**Ideia central.** O app já tem uma imagem que é só dele: a **régua do mês**, uma barra em que a parte cheia é o que já saiu da receita e uma marca fina é o dia de hoje. Enquanto a barra fica atrás da marca, o mês está folgado. Essa é a peça mais característica do assunto (o mês da casa visto como tempo e dinheiro ao mesmo tempo), então o design system gasta a ousadia nela e deixa todo o resto quieto.

Três princípios:

1. **Uma peça memorável, o resto disciplinado.** A régua vira o elemento interativo principal do painel (dá para percorrer dia a dia, com o teclado ou o mouse, e ela conversa com o gráfico de ritmo). Cards, listas e menus são silenciosos: tom de superfície, fio de 1px, sem gradientes de enfeite.
2. **Cor é significado.** Verde = receita/meta em dia, rosa = gasto/meta estourada, âmbar = alerta, teal = marca e ação. Nada mais usa esses tons. As categorias têm uma paleta própria que evita os quatro. Cor nunca aparece sozinha: sempre com sinal (`+`/`−`), seta, ícone ou texto.
3. **Interação que responde, não que enfeita.** Movimento só quando a pessoa age (passar o mouse, abrir, trocar de mês, filtrar) ou uma única vez na abertura do painel (a régua enche e o número principal conta). Nada de cada card entrar deslizando.

**O que muda em relação ao visual atual e por quê:**

| Antes | Agora | Motivo |
|---|---|---|
| Fundo preto puro `#000` e cards `#121212` neutros | Fundo preto puro `#000000` (mantido por escolha do usuário) e superfícies em "tinta" levemente esverdeada, em quatro degraus | Preto puro com uma cor viva é o padrão genérico de painel escuro; o tom puxado para o teal da marca dá identidade e espaço para elevação (cada degrau de superfície fica visível). Também reduz o "smear" de preto absoluto em telas OLED ao rolar. |
| Claro: cinza `#f4f4f4` neutro | "Névoa": `#F1F5F4`, cinza frio com o mesmo matiz da tinta | Os dois temas passam a ser a mesma família; evita o creme quente que virou clichê. |
| Teal 600 `#0d9488` em botões e links no claro | Teal 700 `#0F766E` | Branco sobre `#0d9488` dá 3,74:1 e o link teal sobre branco também: **reprova** AA para texto. `#0F766E` dá 5,47:1. O teal `#14B8A6` da marca continua no logo e no tema escuro. |
| Verde 600, rosa 600 e âmbar 600 no claro | Verde 700, rosa 700, âmbar 700 | Verde 600 (3,3:1) e âmbar 600 (3,2:1) sobre branco reprovam como texto. |
| Rosa 500 `#f43f5e` no escuro | Rosa 400 `#FB7185` | 4,68:1 sobre o popover passava raspando; 400 dá 6,4:1 e lê melhor em textos pequenos. |
| 15 cores livres de categoria, incluindo verde, vermelho e âmbar | 8 cores nomeadas, com versão clara e escura, sem os tons reservados | Os tons de significado eram usados como cor de categoria e confundiam (uma categoria "verde" parecia receita). Cada cor agora tem duas versões que passam 3:1 nos dois temas. |
| Rótulos `eyebrow` em CAIXA ALTA espaçada | Rótulos em caixa normal, 13px, peso 600 | Caixa alta espaçada em todo rótulo é marca de template e lê pior em português (acentos). |
| Um raio (`1.25rem`) em quase tudo | Raios por papel: chip, controle, bloco, card, folha | Hierarquia visível: o que está dentro de um card é menos arredondado que o card. |

**Tipografia: mantida.** Bricolage Grotesque (títulos e o número do destaque) + Figtree (todo o resto, inclusive valores). A Bricolage tem eixos de tamanho óptico (`opsz`) e largura (`wdth`) que já usamos para deixar o número grande compacto e com personalidade, e a Figtree tem algarismos tabulares de verdade para colunas de valores. As duas já estão carregadas (`@fontsource-variable`), sem custo novo. Não adotamos fonte mono para números: algarismos tabulares da Figtree resolvem o alinhamento sem o ar de "terminal".

**Voz.** O app já fala com a casa no plural ("Que bom ver vocês", "Lancem a receita do mês"). Mantido: amigável, direto, "vocês", frases curtas, verbo na frente. Aprovado pelo usuário em 2026-11-23. Mensagens de erro também falam com "vocês" ("Confiram a conexão e tentem de novo."), nunca "você"/"tente novamente". **Regra única para todo texto que pede uma ação** (botões, avisos, toasts, erros do `mapDbError` em `src/shared/lib/supabase.ts` e validações dos `schema.ts`/Zod): o imperativo vai no plural ("Informem uma data válida.", "Escolham uma categoria.", "Usem no máximo 40 caracteres."). Frases sem verbo dirigido à pessoa ficam impessoais ("A senha precisa ter pelo menos 8 caracteres.", "Registro não encontrado."). Nunca misturar singular e plural na mesma tela. Exceção: rótulos de botão ficam no infinitivo ("Adicionar lançamento", "Tentar de novo").

## 2. Referências que influenciaram

| Referência | O que tiramos dela |
|---|---|
| [Copilot Money](https://moneywithkatie.com/copilot-review-a-budgeting-app-that-finally-gets-it-right/) (finalista do Apple Design Award 2024, [9to5Mac](https://9to5mac.com/2025/06/26/copilot-money-is-the-budgeting-app-youve-been-looking-for/)) | Um painel que responde "como vai o mês" numa olhada: gasto do mês contra o ritmo, categorias com o gasto contra a meta, estouros destacados no próprio painel. Base do destaque + régua + metas. |
| [Monarch Money: refresh do painel (dez/2024)](https://www.monarch.com/monarch-brand-refresh) e [cash flow](https://www.monarch.com/blog/visualize-your-cash-flow-like-never-before) | Widgets mais densos, barras mais baixas e com menos espaço entre elas, paleta revista para contraste; filtros por categoria e agrupamento por período. Base do gráfico de evolução (6/12 meses) e do drill-down por categoria. |
| [Linear: como redesenhamos a UI](https://linear.app/now/how-we-redesigned-the-linear-ui) | Superfícies geradas a partir de um matiz base com degraus de elevação (fundo, painel, diálogo) em vez de cinzas soltos; menos ruído visual no menu lateral. Base da escala "tinta"/"névoa". |
| [IBM Carbon: paletas de data viz](https://carbondesignsystem.com/data-visualization/color-palettes/) e [proposta do GitLab](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/work_items/3378) | Paleta categórica com valores **diferentes por tema** (mais clara no escuro), validada a 3:1 contra a superfície; sequenciais em um só matiz. |
| [Guia de data viz do data.europa.eu](https://data.europa.eu/apps/data-visualisation-guide/accessible-colour-palettes) | Cor nunca sozinha: rótulo direto, padrão ou forma junto. |
| Skill `ui-ux-pro-max` (`--domain chart`, `ux`, `style`) | Barras horizontais ordenadas para comparar categorias (em vez de pizza), linha para tendência com estilos de linha distintos (cheia, tracejada), tabela como alternativa acessível de todo gráfico, "animar 1–2 elementos por tela", movimento com tokens de duração por contexto, esqueleto com `aria-busy`. O gerador de design system sugeriu IBM Plex + âmbar/roxo genérico de fintech: **descartado**, porque a marca já define teal e as fontes. |

## 3. Cores

Todos os pares abaixo foram calculados com a fórmula de luminância da WCAG 2.2 (script de verificação usado na criação; os valores estão arredondados para baixo).

### 3.1 Base (só para o `index.css`; componentes nunca usam)

| Família | Tons |
|---|---|
| Tinta (neutros do escuro) | `ink-1000 #000000`, `ink-950 #0A100F`, `ink-900 #0E1514`, `ink-850 #141D1C`, `ink-800 #1A2422`, `ink-750 #1F2A28`, `ink-700 #2A3735`, `ink-600 #56685F`, `ink-500 #5E6E6B`, `ink-400 #83938F`, `ink-300 #97A6A3`, `ink-100 #E6EEEC` |
| Névoa (neutros do claro) | `mist-0 #FFFFFF`, `mist-50 #F1F5F4`, `mist-100 #E8EEED`, `mist-150 #E3EAE8`, `mist-200 #DCE4E2`, `mist-400 #869592`, `mist-450 #7A8A86`, `mist-500 #687873`, `mist-600 #55665F`, `mist-950 #0C1917` |
| Teal (marca) | `teal-100 #D5F5EF`, `teal-400 #2DD4BF`, `teal-500 #14B8A6`, `teal-700 #0F766E`, `teal-800 #115E59`, `teal-deep #0D2A27`, `teal-ink #032421` |
| Verde | `green-100 #DCFCE7`, `green-500 #22C55E`, `green-700 #15803D`, `green-deep #0B2A1F` |
| Rosa | `rose-100 #FFE4E8`, `rose-400 #FB7185`, `rose-700 #BE123C`, `rose-deep #33121A`, `rose-ink #1A0508` |
| Âmbar | `amber-50 #FEF6E0`, `amber-500 #F59E0B`, `amber-700 #B45309`, `amber-deep #2E220A` |

> **Revisão de 2026-11-23 (pedido do usuário):** o fundo do tema escuro passou de `#070C0B` para preto puro `#000000`. Todos os contrastes sobre o fundo subiram (o preto é o tom mais escuro possível) e os cards (`#0E1514`) se destacam mais (1,14:1 contra 1,07:1). As superfícies continuam em "tinta". Efeito aceito: `sunken` (`#0A100F`) fica levemente mais claro que o fundo quando aparece direto sobre a página; na prática ele quase sempre está dentro de cards. Desvantagem conhecida: rastro ("smear") leve em telas OLED ao rolar rápido.

### 3.2 Semânticas

Os nomes atuais (`background`, `card`, `muted-foreground`, `income`...) foram **mantidos** para que nenhuma tela quebre; os novos completam o que faltava.

| Token (`--x` / classe Tailwind) | Papel | Escuro | Claro |
|---|---|---|---|
| `background` | Fundo do app | `#000000` | `#F1F5F4` |
| `sunken` | Áreas rebaixadas: trilhos de segmentado, fundo de tabela, campo de busca no fundo | `#0A100F` | `#E8EEED` |
| `card` | Superfície padrão (cards, listas) | `#0E1514` | `#FFFFFF` |
| `popover` | Superfície elevada (tooltip, popover, diálogo, folha) | `#141D1C` | `#FFFFFF` + sombra |
| `muted` | Preenchimento neutro (esqueleto, chips neutros, hover de linha) | `#1A2422` | `#E8EEED` |
| `accent` | Hover de botão fantasma e item de menu | `#1F2A28` | `#E3EAE8` |
| `foreground` | Texto principal | `#E6EEEC` | `#0C1917` |
| `muted-foreground` | Texto secundário, rótulos, eixos | `#97A6A3` | `#55665F` |
| `subtle-foreground` | **Só** desabilitado e decoração (isento de contraste) | `#83938F` | `#687873` |
| `border` | Divisores e fios decorativos | `#1F2A28` | `#DCE4E2` |
| `input` | Borda de campo, contorno de botão `outline` (precisa 3:1) | `#56685F` | `#7A8A86` |
| `ring` | Anel de foco | `#14B8A6` | `#0F766E` |
| `primary` / `primary-foreground` | Fundo e texto do botão principal | `#14B8A6` / `#032421` | `#0F766E` / `#FFFFFF` |
| `primary-hover` | Hover do botão principal | `#2DD4BF` | `#115E59` |
| `brand` | Texto e ícone de marca (links, item ativo) | `#2DD4BF` | `#0F766E` |
| `brand-soft` | Fundo suave de marca | `#0D2A27` | `#D5F5EF` |
| `brand-mark` | Fundo do logo (decorativo) | `#14B8A6` | `#14B8A6` |
| `brand-mark-foreground` | Desenho do logo sobre `brand-mark` (6,6:1) | `#032421` | `#032421` |
| `income` / `income-soft` | Receita, meta em dia | `#22C55E` / `#0B2A1F` | `#15803D` / `#DCFCE7` |
| `expense` / `expense-soft` | Gasto, meta estourada | `#FB7185` / `#33121A` | `#BE123C` / `#FFE4E8` |
| `warning` / `warning-soft` | Alerta (meta a partir de 80%) | `#F59E0B` / `#2E220A` | `#B45309` / `#FEF6E0` |
| `destructive` / `destructive-foreground` | Botão de excluir, erro de campo | `#FB7185` / `#1A0508` | `#BE123C` / `#FFFFFF` |
| `track` | Trilho de barras e réguas | `#1A2422` | `#E3EAE8` |
| `chart-grid` | Linhas de grade | `#1A2422` | `#E8EEED` |
| `chart-muted` | Série de comparação (mês anterior, média) | `#5E6E6B` | `#869592` |
| `chart-cursor` | Faixa/linha do cursor no gráfico | `#2A3735` | `#DCE4E2` |
| `overlay` | Véu atrás de diálogo e folha | `rgb(3 6 6 / 0.72)` | `rgb(12 25 23 / 0.40)` |

### 3.3 Contraste validado

| Par | Escuro | Claro | Exigência |
|---|---|---|---|
| `foreground` sobre `background` / `card` / `popover` | 17,8 / 15,7 / 14,6 | 16,4 / 18,0 / 18,0 | 4,5 |
| `muted-foreground` sobre `background` / `card` / `popover` / `sunken` | 8,3 / 7,3 / 6,8 / 7,6 | 5,5 / 6,1 / 6,1 / 5,2 | 4,5 |
| `brand` sobre `card` / `brand-soft` | 9,9 / 8,2 | 5,5 / 4,7 | 4,5 |
| `income` sobre `card` / `background` / `income-soft` | 8,1 / 9,2 / 6,8 | 5,0 / 4,6 / 4,6 | 4,5 |
| `expense` sobre `card` / `popover` / `expense-soft` | 6,9 / 6,4 / 6,3 | 6,3 / 6,3 / 5,2 | 4,5 |
| `warning` sobre `card` / `warning-soft` | 8,6 / 7,3 | 5,0 / 4,7 | 4,5 |
| `primary-foreground` sobre `primary` | 6,6 | 5,5 | 4,5 |
| `destructive-foreground` sobre `destructive` | 7,3 | 6,3 | 4,5 |
| `ring` sobre `background` / `card` | 8,4 / 7,4 | 5,0 / 5,5 | 3 |
| `input` sobre `card` / `background` | 3,1 / 3,5 | 3,6 / 3,3 | 3 |
| `chart-muted` sobre `card` | 3,5 | 3,1 | 3 |

Regras de uso que garantem esses números:

- `income`, `warning` e `brand` no claro passam 4,5 sobre `card` e `background`, mas **não** sobre `muted`/`accent`. Texto colorido só fica sobre `card`, `popover`, `background` ou o `-soft` da mesma cor.
- `subtle-foreground` nunca carrega informação: placeholder usa `muted-foreground`.
- Rótulo de valor dentro de uma barra colorida é proibido; o valor fica fora da barra, em `foreground`.

## 4. Paleta de gráficos

### 4.1 Séries de significado

| Série | Token | Estilo de linha | Marca extra |
|---|---|---|---|
| Este mês (gasto) | `expense` | cheia 2,25px + área 16% | ponto no último dia |
| Projeção | `expense` 60% | tracejada `5 5` | rótulo "Projeção" na legenda |
| Comparação (mês anterior ou média) | `chart-muted` | cheia 2px | rótulo direto no fim da linha |
| Receitas | `income` | barra | sinal "+" no tooltip |
| Gastos | `expense` | barra | sinal "−" no tooltip |
| Saldo | `foreground` | linha 2px com pontos | valor com sinal |

### 4.2 Categórica (categorias)

Oito cores com nome. A pessoa escolhe pelo nome na tela de categorias. A cor `ardosia` é a do grupo "Outras" e de lançamento sem categoria (`FALLBACK_COLOR`).

| Slot | Nome | Token | Escuro (sobre `card` `#0E1514`) | Claro (sobre `#FFFFFF`) |
|---|---|---|---|---|
| 1 | Azul | `cat-azul` | `#60A5FA` 7,3:1 | `#2563EB` 5,2:1 |
| 2 | Roxo | `cat-roxo` | `#A78BFA` 6,8:1 | `#7C3AED` 5,7:1 |
| 3 | Laranja | `cat-laranja` | `#FB923C` 8,2:1 | `#C2410C` 5,2:1 |
| 4 | Fúcsia | `cat-fucsia` | `#E879F9` 7,5:1 | `#A21CAF` 6,3:1 |
| 5 | Ouro | `cat-ouro` | `#FACC15` 12,1:1 | `#A16207` 4,9:1 |
| 6 | Ciano | `cat-ciano` | `#22D3EE` 10,2:1 | `#0E7490` 5,4:1 |
| 7 | Café | `cat-cafe` | `#D6A26E` 8,1:1 | `#8A5A2B` 5,9:1 |
| 8 | Ardósia | `cat-ardosia` | `#94A3B8` 7,2:1 | `#64748B` 4,8:1 |

Todas passam 3:1 (objeto gráfico) e até 4,5:1 (texto) nos dois temas, então podem colorir pontos, barras e o ícone de inicial.

**Categorias antigas que mudam de cor (aprovado pelo usuário).** As que estavam em verde, vermelho ou âmbar passam para ciano, laranja ou ouro (tabela abaixo), porque esses tons agora significam receita, gasto e alerta. O diálogo de edição avisa "A cor foi ajustada para a paleta nova. Salvem para confirmar."

**Como guardar sem mudar o banco.** A coluna `categories.color` continua guardando um hex. O hex gravado passa a ser o **valor claro do slot** (ex.: `#2563EB`), que funciona como identificador. O frontend resolve hex → slot com uma tabela em `src/features/categorias/colors.ts` e pinta com `var(--cat-azul)`, que troca sozinho no tema escuro. Cores antigas também são mapeadas, sem migração:

| Hex antigo | Slot | Hex antigo | Slot |
|---|---|---|---|
| `#f97316` | laranja | `#16a34a` | ciano |
| `#6366f1` | azul | `#22c55e` | ciano |
| `#0ea5e9` | ciano | `#84cc16` | ouro |
| `#14b8a6` | ciano | `#ef4444` | laranja |
| `#ec4899` | fúcsia | `#0891b2` | ciano |
| `#8b5cf6` | roxo | `#a855f7` | roxo |
| `#eab308` | ouro | `#f59e0b` | ouro |
| `#64748b` | ardósia | qualquer outro | ardósia |

Fundos suaves de categoria (círculo da inicial) usam `color-mix(in oklab, var(--cat-x) 16%, transparent)` em vez do sufixo `24` no hex.

**Limite.** Os gráficos mostram no máximo 6 fatias (5 categorias + "Outras", como `foldCategories` já faz). Com 8 cores, cores repetem só em listas, onde o nome está sempre escrito ao lado. Risco conhecido: para quem tem deuteranopia, laranja, ouro e café ficam próximos; por isso toda fatia, barra e linha de categoria tem o **nome escrito** (rótulo direto ou linha da lista), e o tooltip repete o nome.

### 4.3 Sequencial (intensidade, ex.: calendário de gastos)

Um só matiz (teal), 5 degraus, mais forte = mais gasto. O dia sem gasto usa `track`.

| Degrau | Token | Escuro | Claro |
|---|---|---|---|
| 1 | `seq-1` | `#12302C` | `#CCF0EA` |
| 2 | `seq-2` | `#115E56` | `#8FDDD1` |
| 3 | `seq-3` | `#0F8A7E` | `#3FBFAF` |
| 4 | `seq-4` | `#2DD4BF` | `#0D7D72` (revisão: era `#0F8A7E`, que dava 4,2:1 com o número em `card`) |
| 5 | `seq-5` | `#99F6E4` | `#0B5B53` |

Os degraus 4 e 5 passam 3:1 contra a superfície; os mais claros não, e isso é aceito porque a intensidade **nunca é a única fonte do valor**: cada célula mostra o número do dia, abre tooltip no foco/hover com o valor, e o card tem a visão em tabela. Texto sobre célula: `foreground` nos degraus 1–3 e `background` nos degraus 4–5 (escuro) / `card` nos degraus 4–5 (claro).

Não há paleta divergente: saldo positivo/negativo usa `income`/`expense` com sinal.

## 5. Superfícies, elevação, raios e espaço

### 5.1 Elevação

| Nível | Uso | Fundo | Sombra (token) |
|---|---|---|---|
| 0 | Página | `background` | nenhuma |
| -1 | Trilhos, busca no fundo | `sunken` | nenhuma |
| 1 | Card, lista | `card` | `shadow-edge` (fio de 1px) |
| 1+ | Card clicável em hover | `card` | `shadow-raised` |
| 2 | Tooltip, popover, menu | `popover` | `shadow-overlay` |
| 3 | Diálogo, folha lateral | `popover` | `shadow-dialog` + `overlay` atrás |

No escuro, a elevação vem do tom (cada nível é um degrau mais claro) e de um fio interno; no claro, de sombra fria (matiz da tinta, nunca preto puro).

### 5.2 Raios

| Token (`rounded-*`) | Valor | Uso |
|---|---|---|
| `rounded-chip` | 6px | Barras de gráfico, células do calendário, swatches |
| `rounded-control` | 12px | Campos, selects, itens de menu lateral, blocos dentro de card |
| `rounded-card` | 20px | Cards e listas |
| `rounded-sheet` | 28px | Diálogo, folha de baixo (cantos de cima), folha lateral (cantos da esquerda) |
| `rounded-full` | pílula | Botões, segmentado, badges, pílula de variação |

Os nomes antigos (`rounded-xl`, `rounded-lg`) continuam existindo, mas telas novas usam os nomes por papel.

### 5.3 Espaço

Base de 4px (escala padrão do Tailwind). Os papéis:

| Token | Valor | Classe Tailwind | Uso |
|---|---|---|---|
| `space-inset-sm` | 12px | `p-3` | Tooltip, chip, célula de tabela |
| `space-inset-md` | 16px | `p-4` | Card no celular, item de lista |
| `space-inset-lg` | 24px | `p-6` | Card a partir de 640px, diálogo |
| `space-stack-xs` | 4px | `gap-1` | Rótulo → valor |
| `space-stack-sm` | 8px | `gap-2` | Dentro de um grupo |
| `space-stack-md` | 16px | `gap-4` | Entre blocos de um card |
| `space-gutter` | 12px → 16px (`lg`) | `gap-3 lg:gap-4` | Entre cards de uma grade |
| `space-section` | 32px → 48px (`md`) | `gap-8 md:gap-12` | Entre seções da página |
| `space-page-x` | 16 / 24 / 40px | `px-4 sm:px-6 md:px-10` | Margem lateral |

Os valores são declarados como variáveis no `:root` (para JS e para `p-(--space-inset-md)` quando útil), e as specs citam o token; a coluna "classe" é o equivalente direto.

Larguras: conteúdo até `max-w-6xl` (1152px) nas telas de gestão; painel até `1360px` (`--content-wide`).

Breakpoints: os do Tailwind (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Testar em 375, 768, 1024 e 1440.

## 6. Tipografia

Escala de terça maior (×1,25), arredondada para a grade de 4px. Corpo nunca menor que 14px; 12px só para eixos e metadados curtos.

| Token (`text-*`) | Tamanho / altura | Fonte e peso | Uso |
|---|---|---|---|
| `text-caption` | 12 / 16 | Figtree 500 | Eixos, nota de rodapé de card, contadores |
| `text-label` | 13 / 18 | Figtree 600 | Rótulo acima de valor (`eyebrow`), cabeçalho de tabela, legenda |
| `text-body-sm` | 14 / 20 | Figtree 400–600 | Texto de card, botões, listas densas |
| `text-body` | 16 / 24 | Figtree 400 | Texto corrido, campos |
| `text-lead` | 18 / 27 | Figtree 400 | Frase de contexto do destaque |
| `text-title-sm` | 18 / 24 | Bricolage 600 | Título de card |
| `text-title` | 22 / 28 | Bricolage 600 | Título de diálogo/folha, saudação |
| `text-heading` | 28 / 32 | Bricolage 600 | Título de página no celular, valor de KPI no desktop (Figtree) |
| `text-display` | 40 / 44 | Bricolage 600 | Título de página a partir de 640px |
| `text-hero` | 44 → 84 (fluido) / 0,95 | Figtree 600, `numeral-hero` | Número do destaque do painel |

Regras:

- Valores em lista e indicador: utilitário `figure` (Figtree, `tabular-nums`, `letter-spacing -0.015em`).
- Número do destaque: Figtree com algarismos proporcionais (já é assim hoje); a Bricolage fica nos títulos e no campo de valor do formulário (`numeral`).
- `eyebrow` passa a ser **caixa normal**, `text-label`, cor `muted-foreground`. Ex.: "Saldo livre do mês", não "SALDO LIVRE DO MÊS".
- Títulos com `text-wrap: balance`; parágrafos com `pretty`; linhas de texto até ~70 caracteres (`max-w-prose`/`max-w-2xl`).
- Nunca `font-feature-settings` no `html` (anula `tabular-nums`, ver `ARQUITETURA.md`).

## 7. Movimento

| Token | Valor | Uso |
|---|---|---|
| `--duration-instant` | 90ms | Pressionar (escala 0,97), troca de ícone |
| `--duration-fast` | 150ms | Hover de cor/fundo, foco |
| `--duration-base` | 220ms | Segmentado, abas, tooltip, destaque de série |
| `--duration-slow` | 360ms | Folha lateral/de baixo, diálogo, troca de mês no destaque |
| `--duration-chart` | 700ms | Gráficos entrando e mudando de dados |
| `--duration-hero` | 900ms | Régua enchendo e contagem do número, **uma vez** por abertura do painel |
| `--duration-flash` | 1200ms | Fundo `brand-soft` da linha salva esmaecendo (`row-flash`) |
| `--duration-flash-hold` | 1000ms | Mesma marca com movimento reduzido: fica e some, sem esmaecer |
| `--duration-loop` | 1400ms | Um ciclo da barra de progresso indeterminada (`progress-indeterminate`); com movimento reduzido ela fica parada |

| Easing | Curva | Uso |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Mudanças de estado (hover, abas) |
| `ease-fluid` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas e preenchimentos (régua, barras, folha) |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Saídas (fechar folha/diálogo), sempre ~70% da duração de entrada |

Regras:

- Animar só `transform`, `opacity`, cor e `clip-path`/`scaleX`; nunca `width`/`height` (as barras de progresso atuais animam `width`: trocar por `scaleX` com `transform-origin: left`).
- No máximo 1–2 elementos animando sozinhos por tela (no painel: régua + número do destaque).
- **`prefers-reduced-motion: reduce`**: as durações viram `1ms`, a contagem do número mostra o valor final na hora, os gráficos do Recharts recebem `isAnimationActive={false}`, folhas e diálogos aparecem só com opacidade. O hook `usePrefersReducedMotion()` (em `src/shared/hooks/`) é a única fonte para o JS.

## 8. Foco

- Todo elemento interativo mostra `outline: 2px solid var(--ring)` com `outline-offset: 2px` em `:focus-visible`. Em campos, além do contorno, a borda vira `ring` e ganha halo `0 0 0 3px var(--brand-soft)`.
- Elementos de gráfico focáveis (barra, célula, ponto da régua) usam o mesmo anel, desenhado como contorno do SVG ou um `<rect>` com `stroke: var(--ring)`.
- `scroll-padding-top: 4.5rem` e `scroll-padding-bottom: 6.5rem` no `html`, para o foco não ficar escondido sob o cabeçalho fixo e a barra de baixo no celular.
- Ordem de foco segue a ordem visual; nada de `tabindex` positivo.

## 9. Bloco para o `src/index.css`

> **Histórico.** Este bloco foi o ponto de partida e já foi aplicado. A fonte da verdade é o `src/index.css`; tokens criados depois (revisão de design: `brand-mark-foreground`, `--duration-flash`, `--duration-flash-hold`, `--duration-loop`, `row-flash`, `progress-indeterminate`, `seq-4` claro `#0D7D72`) estão só lá e nas tabelas acima.

Substitui do começo do arquivo até o fim do `@layer base`, e as utilidades e animações. Mantém todos os nomes que as telas já usam.

```css
@import 'tailwindcss';
@import '@fontsource-variable/bricolage-grotesque/standard.css';
@import '@fontsource-variable/figtree';

@custom-variant dark (&:is(.dark *));

/*
  Design system "Régua" (docs/design/design-system.md).
  Camada 1, base: valores crus. Componentes NUNCA usam estes nomes.
*/
:root {
  /* Tinta: neutros do escuro, puxados para o teal da marca */
  --ink-1000: #000000;
  --ink-950: #0a100f;
  --ink-900: #0e1514;
  --ink-850: #141d1c;
  --ink-800: #1a2422;
  --ink-750: #1f2a28;
  --ink-700: #2a3735;
  --ink-600: #56685f;
  --ink-500: #5e6e6b;
  --ink-400: #83938f;
  --ink-300: #97a6a3;
  --ink-100: #e6eeec;
  /* Névoa: neutros do claro, mesmo matiz */
  --mist-0: #ffffff;
  --mist-50: #f1f5f4;
  --mist-100: #e8eeed;
  --mist-150: #e3eae8;
  --mist-200: #dce4e2;
  --mist-400: #869592;
  --mist-450: #7a8a86;
  --mist-500: #687873;
  --mist-600: #55665f;
  --mist-950: #0c1917;
  /* Marca e significado */
  --teal-100: #d5f5ef;
  --teal-400: #2dd4bf;
  --teal-500: #14b8a6;
  --teal-700: #0f766e;
  --teal-800: #115e59;
  --teal-deep: #0d2a27;
  --teal-ink: #032421;
  --green-100: #dcfce7;
  --green-500: #22c55e;
  --green-700: #15803d;
  --green-deep: #0b2a1f;
  --rose-100: #ffe4e8;
  --rose-400: #fb7185;
  --rose-700: #be123c;
  --rose-deep: #33121a;
  --rose-ink: #1a0508;
  --amber-50: #fef6e0;
  --amber-500: #f59e0b;
  --amber-700: #b45309;
  --amber-deep: #2e220a;

  /* Movimento e espaço: iguais nos dois temas */
  --duration-instant: 90ms;
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-slow: 360ms;
  --duration-chart: 700ms;
  --duration-hero: 900ms;
  --space-inset-sm: 0.75rem;
  --space-inset-md: 1rem;
  --space-inset-lg: 1.5rem;
  --space-stack-xs: 0.25rem;
  --space-stack-sm: 0.5rem;
  --space-stack-md: 1rem;
  --space-gutter: 0.75rem;
  --space-section: 2rem;
  --content-wide: 85rem;
  --radius: 1.25rem;
}

@media (min-width: 1024px) {
  :root {
    --space-gutter: 1rem;
  }
}

@media (min-width: 768px) {
  :root {
    --space-section: 3rem;
  }
}

/* Camada 2, semântica: tema claro */
:root {
  color-scheme: light;
  --background: var(--mist-50);
  --sunken: var(--mist-100);
  --foreground: var(--mist-950);
  --card: var(--mist-0);
  --card-foreground: var(--mist-950);
  --popover: var(--mist-0);
  --popover-foreground: var(--mist-950);
  --primary: var(--teal-700);
  --primary-hover: var(--teal-800);
  --primary-foreground: var(--mist-0);
  --secondary: var(--mist-100);
  --secondary-foreground: var(--mist-950);
  --muted: var(--mist-100);
  --muted-foreground: var(--mist-600);
  --subtle-foreground: var(--mist-500);
  --accent: var(--mist-150);
  --accent-foreground: var(--mist-950);
  --destructive: var(--rose-700);
  --destructive-foreground: var(--mist-0);
  --border: var(--mist-200);
  --input: var(--mist-450);
  --ring: var(--teal-700);
  --brand: var(--teal-700);
  --brand-foreground: var(--mist-0);
  --brand-soft: var(--teal-100);
  --brand-mark: var(--teal-500);
  --income: var(--green-700);
  --income-soft: var(--green-100);
  --expense: var(--rose-700);
  --expense-soft: var(--rose-100);
  --warning: var(--amber-700);
  --warning-soft: var(--amber-50);
  --track: var(--mist-150);
  --chart-grid: var(--mist-100);
  --chart-muted: var(--mist-400);
  --chart-cursor: var(--mist-200);
  --overlay: rgb(12 25 23 / 0.4);

  --cat-azul: #2563eb;
  --cat-roxo: #7c3aed;
  --cat-laranja: #c2410c;
  --cat-fucsia: #a21caf;
  --cat-ouro: #a16207;
  --cat-ciano: #0e7490;
  --cat-cafe: #8a5a2b;
  --cat-ardosia: #64748b;

  --seq-1: #ccf0ea;
  --seq-2: #8fddd1;
  --seq-3: #3fbfaf;
  --seq-4: #0f8a7e;
  --seq-5: #0b5b53;

  --elev-edge: 0 0 0 1px rgb(12 25 23 / 0.06), 0 1px 2px rgb(12 25 23 / 0.05);
  --elev-raised: 0 0 0 1px rgb(12 25 23 / 0.07), 0 14px 32px -18px rgb(12 25 23 / 0.32);
  --elev-overlay: 0 0 0 1px rgb(12 25 23 / 0.08), 0 16px 40px -12px rgb(12 25 23 / 0.3);
  --elev-dialog: 0 0 0 1px rgb(12 25 23 / 0.06), 0 28px 72px -24px rgb(12 25 23 / 0.45);
  /* compatibilidade: o nome antigo aponta para o novo */
  --card-edge: var(--elev-edge);
}

/* Camada 2, semântica: tema escuro (o padrão) */
.dark {
  color-scheme: dark;
  --background: var(--ink-1000);
  --sunken: var(--ink-950);
  --foreground: var(--ink-100);
  --card: var(--ink-900);
  --card-foreground: var(--ink-100);
  --popover: var(--ink-850);
  --popover-foreground: var(--ink-100);
  --primary: var(--teal-500);
  --primary-hover: var(--teal-400);
  --primary-foreground: var(--teal-ink);
  --secondary: var(--ink-800);
  --secondary-foreground: var(--ink-100);
  --muted: var(--ink-800);
  --muted-foreground: var(--ink-300);
  --subtle-foreground: var(--ink-400);
  --accent: var(--ink-750);
  --accent-foreground: var(--ink-100);
  --destructive: var(--rose-400);
  --destructive-foreground: var(--rose-ink);
  --border: var(--ink-750);
  --input: var(--ink-600);
  --ring: var(--teal-500);
  --brand: var(--teal-400);
  --brand-foreground: var(--teal-ink);
  --brand-soft: var(--teal-deep);
  --brand-mark: var(--teal-500);
  --income: var(--green-500);
  --income-soft: var(--green-deep);
  --expense: var(--rose-400);
  --expense-soft: var(--rose-deep);
  --warning: var(--amber-500);
  --warning-soft: var(--amber-deep);
  --track: var(--ink-800);
  --chart-grid: var(--ink-800);
  --chart-muted: var(--ink-500);
  --chart-cursor: var(--ink-700);
  --overlay: rgb(3 6 6 / 0.72);

  --cat-azul: #60a5fa;
  --cat-roxo: #a78bfa;
  --cat-laranja: #fb923c;
  --cat-fucsia: #e879f9;
  --cat-ouro: #facc15;
  --cat-ciano: #22d3ee;
  --cat-cafe: #d6a26e;
  --cat-ardosia: #94a3b8;

  --seq-1: #12302c;
  --seq-2: #115e56;
  --seq-3: #0f8a7e;
  --seq-4: #2dd4bf;
  --seq-5: #99f6e4;

  --elev-edge: inset 0 0 0 1px rgb(230 238 236 / 0.06);
  --elev-raised: inset 0 0 0 1px rgb(230 238 236 / 0.1), 0 18px 40px -20px rgb(0 0 0 / 0.85);
  --elev-overlay: inset 0 0 0 1px rgb(230 238 236 / 0.1), 0 20px 48px -16px rgb(0 0 0 / 0.85);
  --elev-dialog: inset 0 0 0 1px rgb(230 238 236 / 0.08), 0 32px 80px -24px rgb(0 0 0 / 0.9);
  --card-edge: var(--elev-edge);
}

/* Camada 3: o que vira classe do Tailwind */
@theme inline {
  --font-sans: 'Figtree Variable', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Bricolage Grotesque Variable', 'Figtree Variable', ui-sans-serif, sans-serif;

  --color-background: var(--background);
  --color-sunken: var(--sunken);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-subtle-foreground: var(--subtle-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-soft: var(--brand-soft);
  --color-brand-mark: var(--brand-mark);
  --color-income: var(--income);
  --color-income-soft: var(--income-soft);
  --color-expense: var(--expense);
  --color-expense-soft: var(--expense-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-track: var(--track);
  --color-chart-grid: var(--chart-grid);
  --color-chart-muted: var(--chart-muted);
  --color-chart-cursor: var(--chart-cursor);
  --color-cat-azul: var(--cat-azul);
  --color-cat-roxo: var(--cat-roxo);
  --color-cat-laranja: var(--cat-laranja);
  --color-cat-fucsia: var(--cat-fucsia);
  --color-cat-ouro: var(--cat-ouro);
  --color-cat-ciano: var(--cat-ciano);
  --color-cat-cafe: var(--cat-cafe);
  --color-cat-ardosia: var(--cat-ardosia);
  --color-seq-1: var(--seq-1);
  --color-seq-2: var(--seq-2);
  --color-seq-3: var(--seq-3);
  --color-seq-4: var(--seq-4);
  --color-seq-5: var(--seq-5);

  --text-caption: 0.75rem;
  --text-caption--line-height: 1rem;
  --text-label: 0.8125rem;
  --text-label--line-height: 1.125rem;
  --text-body-sm: 0.875rem;
  --text-body-sm--line-height: 1.25rem;
  --text-body: 1rem;
  --text-body--line-height: 1.5rem;
  --text-lead: 1.125rem;
  --text-lead--line-height: 1.6875rem;
  --text-title-sm: 1.125rem;
  --text-title-sm--line-height: 1.5rem;
  --text-title: 1.375rem;
  --text-title--line-height: 1.75rem;
  --text-heading: 1.75rem;
  --text-heading--line-height: 2rem;
  --text-display: 2.5rem;
  --text-display--line-height: 2.75rem;
  --text-hero: clamp(2.75rem, 1.9rem + 3.6vw, 5.25rem);
  --text-hero--line-height: 0.95;

  --radius-chip: 0.375rem;
  --radius-control: 0.75rem;
  --radius-card: var(--radius);
  --radius-sheet: 1.75rem;
  /* nomes antigos, mantidos */
  --radius-sm: 0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.75rem;
  --radius-xl: var(--radius);
  --radius-2xl: 1.75rem;

  --shadow-edge: var(--elev-edge);
  --shadow-raised: var(--elev-raised);
  --shadow-overlay: var(--elev-overlay);
  --shadow-dialog: var(--elev-dialog);

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-fluid: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  --container-wide: var(--content-wide);
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    @apply font-sans antialiased;
    -webkit-tap-highlight-color: transparent;
    scroll-padding-top: 4.5rem;
    scroll-padding-bottom: 6.5rem;
  }

  body {
    margin: 0;
    min-height: 100svh;
    background: var(--background);
    color: var(--foreground);
    transition:
      background-color var(--duration-base) var(--ease-standard),
      color var(--duration-base) var(--ease-standard);
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    font-variation-settings: 'opsz' 32;
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  ::selection {
    background: var(--brand-soft);
  }
}

@utility font-display {
  font-family: var(--font-display);
  font-variation-settings: 'opsz' 60;
}

/* Número do campo de valor e números de título: Bricolage compacta. */
@utility numeral {
  font-family: var(--font-display);
  font-variant-numeric: lining-nums proportional-nums;
  font-variation-settings: 'opsz' 96, 'wdth' 88;
  letter-spacing: -0.025em;
}

/* Número do destaque do painel. */
@utility numeral-hero {
  font-family: var(--font-sans);
  font-size: var(--text-hero);
  line-height: 0.95;
  font-weight: 600;
  font-variant-numeric: lining-nums proportional-nums;
  letter-spacing: -0.035em;
}

/* Valor em lista e indicador: alinha em coluna. */
@utility figure {
  font-family: var(--font-sans);
  font-variant-numeric: lining-nums tabular-nums;
  letter-spacing: -0.015em;
}

/* Rótulo pequeno acima de um valor. Caixa normal, nunca caixa alta. */
@utility eyebrow {
  font-size: 0.8125rem;
  line-height: 1.125rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

@utility surface {
  background: var(--card);
  color: var(--card-foreground);
  border-radius: var(--radius);
  box-shadow: var(--elev-edge);
}

/* Card inteiro clicável (link ou botão). */
@utility surface-interactive {
  cursor: pointer;
  transition:
    transform var(--duration-base) var(--ease-fluid),
    box-shadow var(--duration-base) var(--ease-standard);
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--elev-raised);
  }
  &:active {
    transform: translateY(0) scale(0.99);
  }
}

/* Esqueleto: brilho lento; parado com movimento reduzido. */
@utility skeleton {
  border-radius: var(--radius-control);
  background: linear-gradient(90deg, var(--muted) 0%, var(--accent) 50%, var(--muted) 100%);
  background-size: 200% 100%;
  animation: skeleton-sheen 1.6s linear infinite;
}

@keyframes skeleton-sheen {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialog-in {
  from { opacity: 0; transform: translate(-50%, -47%) scale(0.97); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes sheet-in {
  from { transform: translateY(100%); }
  to { transform: none; }
}

@keyframes sheet-side-in {
  from { transform: translateX(100%); }
  to { transform: none; }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: none; }
}

@keyframes fill-in {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes page-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.overlay-in { animation: overlay-in var(--duration-base) var(--ease-standard); }
.dialog-in { animation: dialog-in 280ms var(--ease-fluid); }
.sheet-side-in { animation: sheet-side-in var(--duration-slow) var(--ease-fluid); }
.pop-in { animation: pop-in var(--duration-base) var(--ease-fluid); transform-origin: var(--radix-popper-transform-origin, center); }
.page-in { animation: page-in var(--duration-base) var(--ease-standard) both; }

@media (max-width: 639px) {
  .dialog-in,
  .sheet-side-in {
    animation: sheet-in 340ms var(--ease-fluid);
  }
}

/* A régua do mês e as barras de progresso enchem uma vez. */
.fill-in {
  transform-origin: left;
  animation: fill-in var(--duration-hero) var(--ease-fluid) 120ms both;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 1ms;
    --duration-fast: 1ms;
    --duration-base: 1ms;
    --duration-slow: 1ms;
    --duration-chart: 1ms;
    --duration-hero: 1ms;
  }

  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

Notas para quem aplica:

- `@utility` com `&:hover` aninhado é suportado no Tailwind 4. Se a versão instalada reclamar, separar em `.surface-interactive:hover`.
- Usar durações nas classes com a sintaxe do Tailwind 4: `duration-(--duration-fast)`, `ease-standard`.
- No Recharts, passar cores como `var(--cat-azul)`, `var(--expense)`; `animationDuration={700}` e `isAnimationActive={!reducedMotion}`.
- O painel esquerdo de login (`auth-shell.tsx`) hoje tem hex cru (`#eaf6f4`, `#22c55e`): envolver esse painel em `class="dark"` e usar os tokens.
- `bg-destructive/8` e afins continuam funcionando (opacidade sobre variável é suportada pelo Tailwind 4 via `color-mix`).

## 10. Componentes

Cada componente lista anatomia, variantes, estados e tokens. "Toque ≥ 44px" vale para `pointer: coarse` (celular); no desktop, 40px é aceito para controles secundários.

### 10.1 Button (`shared/ui/button.tsx`)

- **Anatomia:** contêiner pílula (`rounded-full`) + ícone opcional à esquerda (16px, `aria-hidden`) + rótulo (`text-body-sm`, 600). Ícone sozinho exige `aria-label`.
- **Variantes:**

| Variante | Fundo / texto | Hover | Uso |
|---|---|---|---|
| `primary` (atual `default`) | `primary` / `primary-foreground` | `primary-hover` | Uma ação principal por área |
| `secondary` | `secondary` / `secondary-foreground` | `accent` | Ação de apoio |
| `outline` | transparente, contorno interno 1px `input` / `foreground` | `accent` | Ação neutra ao lado da principal |
| `ghost` | transparente / `foreground` | `accent` | Ações em lista, ícones |
| `destructive` | `destructive` / `destructive-foreground` | 90% | Confirmar exclusão |
| `link` (nova) | transparente / `brand`, sublinhado no hover | sublinhado | "Ver todos", "Ajustar metas" |

- **Tamanhos:** `sm` 36px (com área de toque de 44px via `::after` em `pointer: coarse`), `md` 40px, `lg` 48px, `icon` 40px (44px em `pointer: coarse`).
- **Estados:** hover (acima, `duration-fast`); pressionado (`scale(0.97)`, `duration-instant`); foco (anel `ring`); desabilitado (`opacity .45`, `cursor-not-allowed`, sem hover); carregando (rótulo vira o verbo no gerúndio, ex.: "Salvando...", com um spinner de 16px à esquerda e `aria-busy="true"`; largura não muda).

### 10.2 Card (`shared/ui/card.tsx`)

- **Anatomia:** `surface` (`card`, `rounded-card`, `shadow-edge`) → cabeçalho (título `text-title-sm` + descrição `text-body-sm muted-foreground` + ação à direita) → conteúdo (`space-inset-md`, `lg` a partir de 640px) → rodapé opcional (fio `border` em cima, `text-caption`).
- **Variantes:** `static` (padrão); `interactive` (link/botão inteiro, `surface-interactive`, chevron que aparece no hover/foco); `section` (sem caixa, título direto na página, como o `Section` atual).
- **Estados:** hover (só `interactive`: sobe 2px e `shadow-raised`); foco (anel no card inteiro); carregando (esqueleto com as mesmas medidas); vazio (`EmptyState` compacto dentro do conteúdo); erro (`QueryError` compacto dentro do conteúdo, o resto do painel continua).
- Card interativo **não** pode conter outros controles; se tiver, a área clicável é só o título/ação (evita botão dentro de link).

### 10.3 Badge (novo, `shared/ui/badge.tsx`)

- **Anatomia:** pílula 22px de altura, `text-caption` 600, ícone 12px opcional + texto. Nunca só cor.
- **Variantes:** `neutral` (`muted` / `muted-foreground`), `brand` (`brand-soft` / `brand`), `income`, `expense`, `warning` (`*-soft` / `*`).
- **Uso especial, `Delta`:** variação contra a comparação. Seta (`ArrowUpRight`/`ArrowDownRight`/`Minus`) + sinal + valor ("+12%", "−R$ 80,00"). A cor diz se é bom ou ruim para aquele indicador (gasto subindo = `expense`; receita subindo = `income`; zero = `neutral`). Texto ao lado: "vs outubro" ou "vs média". Leitor de tela: "12% a mais que outubro".

### 10.4 Input, Select e Field (`shared/ui/dialog.tsx` → mover para `shared/ui/field.tsx`)

- **Anatomia:** rótulo visível (`text-body-sm` 500) → controle (48px no celular, 44px no desktop, `rounded-control`, fundo `card`, borda `input`) → ajuda (`text-caption muted-foreground`) ou erro (`text-body-sm expense` com ícone `CircleAlert`, `role="alert"`, ligado por `aria-describedby`).
- **Variantes:** texto, senha (botão de mostrar 40px), valor em R$ (prefixo "R$" + `numeral` 24px), data, busca (ícone `Search` + botão limpar), select nativo (seta em SVG com cor `muted-foreground` via `currentColor`, não hex cru).
- **Estados:** repouso; hover (borda `muted-foreground`); foco (borda `ring` + halo `brand-soft`); inválido (`aria-invalid`, borda `destructive`, mensagem abaixo); desabilitado (`opacity .5`, `cursor-not-allowed`); só leitura (fundo `sunken`).
- Placeholder nunca substitui rótulo; usa `muted-foreground`.

### 10.5 Dialog e Sheet (`shared/ui/dialog.tsx`, `shared/ui/sheet.tsx` novo)

- **Dialog** (formulários, confirmações): centralizado a partir de 640px (largura 28rem, `rounded-sheet`, `shadow-dialog`, `space-inset-lg`); no celular, folha que sobe de baixo com alça. Título `text-title`, descrição `text-body-sm`, botão Fechar 40px (`aria-label="Fechar"`). Ações: principal à direita no desktop; no celular, empilhadas e largas, com a principal em cima (`flex-col-reverse`, como o `DialogActions` atual).
- **Sheet** (novo, para o drill-down do painel): Radix Dialog com `side="right"`. Desktop: largura 26rem (440px), altura total, `rounded-l-sheet`, entra da direita (`sheet-side-in`, 360ms). Celular: folha de baixo até 92% da altura. Cabeçalho fixo (título, subtítulo, Fechar) e corpo rolável.
- **Estados:** abrindo/fechando (entrada `ease-fluid`; saída `ease-exit` em 250ms); com movimento reduzido só opacidade. Foco vai para o título ao abrir e volta para o elemento que abriu ao fechar. `Esc` e clique no véu fecham. Folha aberta por URL (`?categoria=`) fecha removendo o parâmetro (o botão Voltar do navegador também fecha).

### 10.6 Tabs e Segmented (`shared/ui/tabs.tsx`, `Segmented`)

- **Anatomia:** trilho `sunken` pílula, padding 4px; opção 36px (44px em `pointer: coarse`), `text-body-sm` 500; ativa em `card` com `shadow-edge` e texto `foreground` (ou `income`/`expense` quando a opção tem tom).
- **Diferença de uso:** `Tabs` troca o conteúdo da área (Radix, `role="tablist"`, setas do teclado); `Segmented` muda um filtro ou valor (`role="radiogroup"`, setas movem e selecionam, `Tab` sai do grupo — hoje cada opção é um tab stop: corrigir com *roving tabindex*).
- **Estados:** hover (texto `foreground`); ativo; foco (anel na opção); desabilitado. Troca: a opção ativa ganha o fundo `card` + `shadow-edge` com transição de cor/sombra em `duration-base`, `ease-standard`. **Decidido na revisão: sem indicador deslizante** (o Radix ToggleGroup não tem indicador; medir posições em JS não paga o custo num controle de 2–3 opções). Nenhum token novo.

### 10.7 Tooltip (novo, `shared/ui/tooltip.tsx`)

- **Dois tipos:**
  - **Tooltip de controle** (Radix Tooltip, recomenda-se adicionar `@radix-ui/react-tooltip`): rótulo curto para botões só de ícone. `popover`, `shadow-overlay`, `rounded-control`, `text-caption`, atraso de 400ms para abrir, abre também no foco do teclado, nunca contém informação que não esteja no `aria-label`.
  - **Tooltip de gráfico** (`ChartTooltip`, conteúdo do Recharts e dos gráficos próprios): título (`text-caption` 600 `muted-foreground`), linhas "amostra de série (com o estilo de linha) + rótulo + valor `figure`", rodapé opcional com a comparação (fio `border` em cima). Largura mínima 12rem, máxima 18rem. Segue o cursor sem cobrir o ponto ativo (desloca 12px). Também aparece com o foco do teclado no ponto/barra/célula, e o mesmo conteúdo vai para uma região `aria-live="polite"` escondida.
- **Estados:** abrindo (`pop-in`, 220ms), fechado. Com movimento reduzido aparece sem escala.

### 10.8 Skeleton (`shared/components/feedback.tsx`)

- Blocos `skeleton` com **as mesmas medidas** do conteúdo final (sem pulo de layout). O contêiner tem `role="status"`, `aria-busy="true"` e `aria-label` ("Carregando o painel"). Só aparece se o carregamento passar de 200ms (evita piscar). Com movimento reduzido, o brilho para e fica o tom `muted`.

### 10.9 EmptyState

- **Anatomia:** ícone em círculo `brand-soft`/`brand` (48px) → título (`text-title-sm`) → frase que diz o que fazer (`text-body-sm muted-foreground`, até 2 linhas) → ação (Button `primary` ou `outline`).
- **Variantes:** `page` (contorno tracejado `input`, padding 56px); `compact` (dentro de card, sem contorno, 32px, ícone 20px sem círculo); `filter` (quando há dados mas o filtro esconde tudo: ação "Limpar filtros").
- Texto sempre convida a agir, nunca só "Sem dados".

### 10.10 KPI / Stat tile (`features/painel/components/kpi-cards.tsx`)

- **Anatomia:** card `interactive` → linha de topo (ícone 28px em `*-soft`, rótulo `eyebrow`, chevron no hover/foco) → valor (`figure`, `text-heading` no desktop / 22px no celular, 600, `Amount` com R$ e centavos menores) → `Delta` → mini tendência (sparkline 40px, último ponto na cor do indicador) → nota (`text-caption`).
- **Variantes:** `income`, `expense`, `balance` (valor em `expense` quando negativo, com "−"), `budget` (valor em % + barra + status com ícone).
- **Estados:** hover/foco (sobe 2px, chevron entra deslizando 2px); ativo/pressionado (`scale .99`); carregando (esqueleto com as quatro linhas); sem comparação ("Sem outubro para comparar" no lugar do Delta); sem dado (valor "R$ 0,00" e nota que convida a lançar).
- O `aria-label` do link resume tudo: "Gastos: R$ 3.200,00, 12% a mais que outubro. Ver lançamentos de gasto."

### 10.11 Listas e tabelas

- **TransactionRow** (lista agrupada por dia): avatar 36px com a inicial da categoria (`color-mix` da cor da categoria 16% + texto na cor) → descrição (`text-body` 500, truncada) e categoria (`text-caption`) → valor (`figure` 600, "+ R$" em `income` para receita, "− R$" em `foreground` para gasto) → ações. Linha com 56px de altura mínima; hover `accent/50`. Cabeçalho de dia: "Hoje", "Ontem", "qui., 12 nov." + total do dia à direita (`text-caption figure`).
- **DataTable** (alternativa de gráfico): cabeçalho fixo `sunken`, `text-label`, primeira coluna à esquerda e números à direita, `figure`, linhas 36px, zebra não; fio `border` entre linhas; `<caption>` (pode ser `sr-only`); `scope="col"`. Rolagem interna até 18rem com sombra de borda indicando que há mais.
- **Estados de linha:** hover, foco (anel na linha quando a linha inteira é clicável), selecionada (fundo `brand-soft`, só no drill-down), recém-criada ou recém-salva: classe `row-flash` do `index.css` (fundo `brand-soft` que esmaece em `--duration-flash`, 1200ms; com movimento reduzido fica `--duration-flash-hold`, 1s, e some sem transição). Para disparar de novo na mesma linha, remontar o elemento (`key` com o token do salvamento). Nada de `style` com milissegundos no componente.

### 10.12 Navegação

- **Menu lateral** (≥ 768px, 248px): logo → botão "Novo lançamento" (`primary`, `lg`) → links (44px, `rounded-control`, ícone 18px; ativo com fundo `card`, ícone `brand` e `aria-current="page"`) → rodapé com conta, tema e sair.
- **Barra de baixo** (< 768px): flutuante, `card/95` com desfoque, `rounded-card`, 4 destinos + botão central "Novo lançamento" (56px, `primary`). Cada destino ≥ 48px de altura. Respeita `safe-area-inset-bottom`.
- **MonthPicker** (substitui o `MonthSwitcher`, ver `telas/shell-navegacao.md`): setas anterior/próximo (40px, 44px no toque) + botão central com o nome do mês que abre um popover com os 12 meses do ano em grade 3×4, cada mês com uma barrinha do gasto (quando o histórico carregado tiver o dado). "Voltar para hoje" aparece quando o mês não é o atual.
- **Link de pular:** "Pular para o conteúdo" no topo, visível no foco.

### 10.13 Toast (Sonner)

- Fundo `popover`, `shadow-overlay`, `rounded-control`, texto `text-body-sm`. Sucesso com ícone `CircleCheck` em `income`; erro com `CircleAlert` em `expense`. Posição: embaixo no centro no celular (acima da barra de baixo, 88px), embaixo à direita no desktop. Duração 4s; erros 6s. A mensagem usa o mesmo verbo do botão ("Adicionar lançamento" → "Lançamento adicionado.").

## 11. Checklist de entrega (para revisão)

- [ ] Nenhum hex cru em componente (inclusive `auth-shell.tsx`, seta do `NativeSelect`, `foldCategories` que usa `#94a3b8` → `var(--cat-ardosia)`).
- [ ] Cores de categoria resolvidas por slot (`categoryColorVar`).
- [ ] Contraste conferido nos dois temas (tabela 3.3).
- [ ] Foco visível em tudo, inclusive pontos de gráfico e células.
- [ ] Toques ≥ 44px no celular.
- [ ] `prefers-reduced-motion` desliga contagem, animações do Recharts e deslizamentos.
- [ ] Todo gráfico tem visão em tabela e frase-resumo.
- [ ] Cor nunca sozinha (sinal, seta, ícone ou nome).
