# Painel (`/painel`)

Tokens e componentes: `docs/design/design-system.md`. Navegação e seletor de mês: `telas/shell-navegacao.md`.

## 1. Propósito

Responder em cinco segundos **"como está o mês da casa?"** (quanto sobra, se o gasto está na frente ou atrás do calendário, o que pesou) e deixar a pessoa **puxar o fio** de qualquer número até os lançamentos que o formam, sem sair do painel.

Tudo é calculado no navegador a partir de `categories`, `transactions` e `budgets` (o que `model.ts` e `insights.ts` já fazem). Nada exige mudança de banco.

## 2. Fluxo

- **Entrada:** depois do login (`/entrar` → `/painel`); item "Painel" do menu; link compartilhado com estado na URL (`/painel?mes=2026-11&comparar=media&categoria=<id>`); voltar de outra tela (o `?mes` é mantido pelo menu).
- **Passos típicos:**
  1. Lê o destaque e a régua ("Sobram R$ 2.340,00", "O gasto está atrás do calendário").
  2. Percorre a régua ou o gráfico de ritmo para ver um dia passado.
  3. Clica numa categoria, numa meta ou num dia → abre a **folha de detalhe** à direita (embaixo no celular).
  4. Da folha: edita um lançamento, vai para Lançamentos já filtrado, ajusta a meta ou cria um lançamento naquela categoria/dia.
- **Saídas:** cards de indicador → Lançamentos (filtrado por tipo) ou Orçamentos; "Ver em Lançamentos" na folha → `/lancamentos?mes=…&categoria=…`; "Ajustar meta" → `/orcamentos?mes=…`; clicar num mês do gráfico de evolução → o próprio painel naquele mês.
- **Recuperação:** erro de carga → "Tentar de novo" no lugar do conteúdo (o seletor de mês continua funcionando); erro de uma parte só (metas) → aviso dentro do card, o resto continua; erro ao salvar dentro da folha → toast com a mensagem e o formulário continua aberto com os dados.

### Estado na URL

| Parâmetro | Valores | Padrão | Efeito |
|---|---|---|---|
| `mes` | `AAAA-MM` | mês atual | Mês aberto (já existe) |
| `comparar` | `anterior`, `media` | `anterior` | Base das variações, da linha de comparação e da marca fantasma da régua |
| `janela` | `6`, `12` | `6` | Janela do gráfico de evolução, das minitendências dos KPIs e do mini-gráfico da folha de categoria (decidido na revisão: `janela` em vez de `historico`) |
| `categoria` | id da categoria, ou `outros` | — | Abre a folha da categoria |
| `dia` | `AAAA-MM-DD` | — | Abre a folha do dia |

Abrir uma folha usa `push` no histórico (o Voltar do navegador fecha); trocar `comparar` e `janela` usa `replace`. Só uma folha por vez: abrir `dia` remove `categoria` e vice-versa.

### Definições de cálculo (todas no frontend)

- **Mês anterior:** como hoje (`insights.previous`).
- **Média de 3 meses:** média dos 3 meses antes do mês aberto **que tenham algum lançamento**; se nenhum tiver, não há comparação. Confirmado na revisão: são os até 3 meses **com lançamento** mais próximos, dentro dos 3 meses anteriores (um mês sem nada lançado não puxa a média para baixo). Para o ritmo, média do acumulado por dia desses meses (dia 31 inexistente usa o último dia do mês).
- **Histórico de 12 meses:** o painel passa a buscar 12 meses numa só consulta (`useTransactionsBetween` com início 11 meses antes), para a troca 6/12 ser instantânea. A média de 3 meses e a evolução saem dessa mesma lista.
- **Variação por categoria:** total da categoria no mês contra o da comparação; só aparece se a comparação tiver valor > 0 naquela categoria; senão, "Nova neste mês".

## 3. Layout

### Desktop (≥ 1280px), largura até `--content-wide` (1360px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Boa tarde                                   [‹  Novembro de 2026  ›] [Hoje]   │
│ segunda, 23 de novembro                     Comparar com (Mês anterior|Média) │
├──────────────────────────────────────────────────────────────────────────────┤
│ Saldo livre do mês                                                            │
│ Sobram R$ 2.340,00                                                            │
│ Em novembro entraram R$ 8.000,00 e já saíram R$ 5.660,00.                     │
│ ████████████████████████████░░░░░░░░│░░░░░░░░░░░░░░  ← régua interativa        │
│ 1    5    10    15    20  ▲23   25    30                                      │
│ Já saiu 71% da receita        Dia 23 de 30       ┆ Em outubro, nesse dia: 64%  │
│ O gasto está atrás do calendário. Dá para respirar.                           │
├───────────────┬───────────────┬───────────────┬──────────────────────────────┤
│ Receitas      │ Gastos        │ Saldo         │ Metas                         │
├──────────────────────────┬────┴───────────────┴──────────────────────────────┤
│ Para onde foi o dinheiro │ Ritmo de gastos (2/3)                              │
│ (1/3)                    │                                                    │
├──────────────────────────┼──────────────────────────┬────────────────────────┤
│ Metas por categoria      │ Lançamentos recentes     │ Dias do mês            │
├──────────────────────────┴──────────────────────────┼────────────────────────┤
│ Evolução: 6 meses | 12 meses (2/3)                  │ Destaques (1/3)        │
└─────────────────────────────────────────────────────┴────────────────────────┘
```

**Uma só ordem no DOM para todas as larguras** (decidido na revisão; resolve o conflito entre UX-48 e UX-49): Para onde foi → Ritmo → Metas → Recentes → Dias do mês → Evolução → Destaques. O desktop lê da esquerda para a direita, de cima para baixo, nessa mesma ordem, e o celular empilha na mesma sequência. **Proibido usar `order-*`** ou `grid-row`/`grid-column` que mude a ordem visual em relação ao DOM (WCAG 1.3.2 e 2.4.3).

- Grade de 12 colunas, `space-gutter` entre cards, `space-section` entre faixas.
- Destaque: texto alinhado à esquerda, largura total; a régua ocupa a largura total do conteúdo.
- Folha de detalhe: 440px à direita, por cima do conteúdo, com véu.

### Tablet (768–1279px)

- Menu lateral visível a partir de 768px. KPIs em 2×2 até 1023px, 4 colunas a partir de 1024px.
- Grade de 2 colunas a partir de 1024px: Para onde foi e Ritmo empilhados em largura total; Metas | Recentes; Dias do mês | Evolução; Destaques em largura total. Abaixo de 1024px, uma coluna. A ordem é sempre a do DOM (acima).

### Celular (< 768px), mobile first

Uma coluna, na ordem do DOM (do mais acionável ao detalhe):

1. Cabeçalho: saudação + data (uma linha cada); abaixo, o seletor de mês em largura total; abaixo, "Comparar com" como segmentado em largura total.
2. Destaque (número em `text-hero` no menor valor, 44px) + régua + leitura da régua.
3. KPIs 2×2 (sem sparkline abaixo de 400px de largura, para caber o valor).
4. Para onde foi o dinheiro.
5. Ritmo de gastos (altura 224px).
6. Metas por categoria.
7. Lançamentos recentes.
8. Dias do mês.
9. Evolução (padrão 6 meses; 12 meses rola na horizontal dentro do card, com as legendas fixas).
10. Destaques.

Folhas abrem de baixo, até 92% da altura, com alça e cabeçalho fixo. O conteúdo tem `pb-28` para não ficar sob a barra de baixo.

## 4. Peças e tokens

### 4.1 Cabeçalho

- Saudação: `text-title` Bricolage; data: `text-body-sm muted-foreground`, primeira letra maiúscula.
- `MonthPicker` (ver shell). "Comparar com": `Segmented` pequeno, rótulo visível "Comparar com" (`text-label muted-foreground`) à esquerda no desktop, acima no celular.

### 4.2 Destaque do mês + régua (a peça-assinatura)

- Rótulo `eyebrow`: "Saldo livre do mês" / "Saldo negativo do mês" / "Resumo do mês".
- Linha do número: verbo em `text-lead`/`0.42em` `muted-foreground` ("Sobram", "Sobraram", "Faltam", "Já saíram") + `Amount` em `numeral-hero` (`expense` quando falta).
- Frase de contexto: `text-lead muted-foreground`, até 2 linhas.
- **Régua:**
  - Trilho `track`, 16px de altura (14px no celular), `rounded-full`.
  - Preenchimento: parte da receita que já saiu. Cor: `primary` (no ritmo), `warning` (gasto 3 pontos ou mais à frente do calendário), `expense` (passou da receita). Quando passa de 100%, a barra fica cheia em `expense` e aparece o texto "Passou R$ 320,00 da receita" à direita, com ícone `CircleAlert`.
  - Marca de hoje: 3px, `foreground`, contorno 2px `background`, 8px acima e abaixo do trilho.
  - **Marca fantasma da comparação:** traço de 2px `chart-muted` no ponto onde a comparação estava no mesmo dia (percentual da receita dela). Só aparece se houver comparação.
  - Escala de dias embaixo: 1, 5, 10, 15, 20, 25, último dia, `text-caption muted-foreground`; o dia de hoje em `foreground` 600.
  - **Cursor de dia** (ao percorrer): linha de 2px `ring` + rótulo flutuante pequeno com "Dia 12" acima do trilho; o preenchimento recua até o acumulado daquele dia (animação `duration-base`, `ease-standard`, via `scaleX`).
  - **Leitura da régua** (linha abaixo, sempre visível, troca com o cursor):
    - Sem cursor: "Já saiu 71% da receita" (com bolinha da cor do preenchimento) | "Dia 23 de 30" (ícone calendário) | "Em outubro, nesse dia: 64%" (traço `chart-muted`).
    - Com cursor: "Até 12 de nov.: saíram R$ 2.890,00, 36% da receita" | "Em outubro, até o dia 12: R$ 2.400,00".
  - Veredito abaixo (`text-body` 500, cor do estado + ícone): `TrendingDown` para "atrás do calendário", `TriangleAlert` para "na frente", `CircleAlert` para "passou da receita". Cor nunca sozinha.

### 4.3 Faixa de indicadores (KPI)

Componente `KpiCard` (design-system 10.10). Quatro cards, todos `interactive`:

| Card | Ícone | Valor | Delta (bom quando) | Nota | Destino |
|---|---|---|---|---|---|
| Receitas | `TrendingUp` em `income-soft` | `Amount` | sobe | "3 lançamentos" | `/lancamentos?mes=…&tipo=receitas` |
| Gastos | `TrendingDown` em `expense-soft` | `Amount` | desce | "42 lançamentos, média de R$ 134,76" | `/lancamentos?mes=…&tipo=gastos` |
| Saldo | `PiggyBank` em `brand-soft` | `Amount` (`expense` se negativo) | sobe (em R$) | "Guardaram 29% da receita" | `/lancamentos?mes=…` |
| Metas | `Target` no tom do status geral: `income-soft`/`income` (em dia), `warning-soft`/`warning` (atenção), `expense-soft`/`expense` (estourada); `muted`/`muted-foreground` sem metas ou com erro | "78% usado" | status com ícone | "Cabem R$ 96,00/dia até o fim do mês" | `/orcamentos?mes=…` |

Decidido na revisão: o ícone de Metas **não** fica em âmbar fixo, porque âmbar significa alerta (princípio "cor é significado").

O texto ao lado do delta acompanha `comparar`: "vs outubro" ou "vs média de 3 meses".

### 4.4 Ritmo de gastos

- Card `static`, cabeçalho: título "Ritmo de gastos", descrição dinâmica (copy na seção 7), à direita o `ViewToggle` (Gráfico/Tabela).
- **Legenda como filtros:** botões-pílula "Este mês", "Projeção", "Outubro" (ou "Média de 3 meses"), cada um com a amostra do estilo de linha; `aria-pressed`; esconder uma série a remove do gráfico e do tooltip. Pelo menos uma fica sempre ligada (a última não pode ser desligada: botão fica `aria-disabled` com tooltip "Deixe pelo menos uma linha visível").
- Gráfico: área de "Este mês" (`expense`, 16%), linha tracejada de projeção, linha `chart-muted` da comparação com **rótulo direto** no fim ("Outubro", `text-caption`), grade `chart-grid`, eixos `muted-foreground` `text-caption`, valores do eixo Y compactos ("R$ 2 mil").
- **Cursor compartilhado com a régua** (`activeDay`): passar o mouse no gráfico move o cursor da régua e vice-versa. Linha vertical `chart-cursor`, ponto ativo 5px com contorno `card`.
- **Tooltip rico** (`ChartTooltip`):
  - Título: "Até 12 de novembro"
  - Linhas: "Este mês R$ 2.890,00", "Outubro R$ 2.400,00" (ou "Média de 3 meses"), "Projeção R$ 6.100,00" (só em dias futuros)
  - Separador; "No dia: R$ 230,00 em 3 gastos"
  - Rodapé: "R$ 490,00 a mais que em outubro" (`expense` + `ArrowUpRight`) ou "a menos" (`income` + `ArrowDownRight`)
  - Dica: "Cliquem para ver o dia" (só com ponteiro fino; no toque: "Toquem de novo para ver o dia")
- **Clique num dia** (ou Enter com o foco no gráfico) → abre a folha do dia.
- Altura: 288px desktop, 224px celular.

### 4.5 Para onde foi o dinheiro

- Cabeçalho: título, descrição "R$ 5.660,00 em gastos, por categoria." e, à direita, `Segmented` pequeno "Gastos | Receitas" (troca `expenseSlices`/`incomeSlices`, estado local).
- **Faixa 100%** (altura 16px, segmentos com 2px de espaço, `rounded-chip` nos internos): decorativa para leitor de tela (`aria-hidden`), interativa para o mouse.
- **Lista ordenada** (até 6 linhas, a 6ª é "Outras (n)"): cada linha é um `button` com: bolinha 10px da cor da categoria, nome, valor (`figure` 600), percentual (`text-caption`), `Delta` compacto ("↑ 12%", "↓ 8%", "Nova neste mês"), barra fina (6px, `track`, preenchida na cor da categoria, relativa à maior).
- **Destaque cruzado:** hover/foco numa linha → o segmento correspondente fica 100% e os outros 35%; hover num segmento → a linha correspondente ganha fundo `accent/50`. Transição `duration-base`.
- **Clique** numa linha → folha da categoria. "Outras (3)" abre **na própria lista** (acordeão, `aria-expanded`) com as categorias agrupadas, cada uma clicável.

### 4.6 Evolução

- Título "Evolução", descrição "Receitas, gastos e saldo mês a mês. O mês aberto fica em destaque.", à direita `Segmented` "6 meses | 12 meses" (`janela`) e o `ViewToggle`.
- Barras agrupadas receita/gasto (`income`/`expense`, `rounded-chip` em cima, largura máx. 18px, espaço 2px), linha de saldo `foreground` 2px com pontos de 4px (ponto vazado quando negativo, com o valor negativo no tooltip). Mês aberto a 100%; os outros a 40%.
- Hover numa coluna: faixa `chart-cursor` e tooltip: "Setembro" → "Receitas + R$ 8.000,00", "Gastos − R$ 6.200,00", rodapé "Saldo + R$ 1.800,00 (guardaram 22%)".
- **Rótulos do eixo X são botões** ("Jun", "Jul"...): Tab chega neles, foco mostra o tooltip daquela coluna, Enter/clique abre o painel naquele mês (`setMonth`, `push`). Clique na coluna faz o mesmo. O mês aberto tem `aria-current="date"`.
- Ao trocar de mês por aqui, a página rola suavemente para o topo (instantâneo com movimento reduzido) e a região viva anuncia "Painel de setembro de 2026".

### 4.7 Dias do mês (calendário de gastos)

- Título "Dias do mês", descrição "Quanto saiu em cada dia. Mais escuro, mais gasto." (no escuro: "Mais forte, mais gasto."), `ViewToggle`.
- Cabeçalho de semana "Dom Seg Ter Qua Qui Sex Sáb" (`text-caption`), grade 7 colunas, células quadradas 40px (44px no celular), `rounded-chip`, número do dia `text-caption` 500.
- Cor: dia sem gasto `track`; com gasto, `seq-1`…`seq-5` por quintil dos dias com gasto do mês. Hoje: anel **externo** 2px `foreground` com afastamento 2px na cor `card` (`ring-2 ring-foreground ring-offset-2 ring-offset-card`), nunca contorno interno: sobre `seq-5` o contorno interno some (1,1:1 no escuro). Abaixo de 400px de largura, as células podem ter 40px (7 colunas não cabem a 44px com a margem do card); a tabela do `ViewToggle` é a alternativa acessível. Dias futuros: `sunken`, número `subtle-foreground`, não clicáveis.
- Legenda embaixo: "Menos" [5 amostras] "Mais".
- Hover/foco: tooltip "qui., 12 nov." → "R$ 230,00 em 3 gastos" (+ "Maior: Mercado, R$ 180,00").
- Clique/Enter → folha do dia. Teclado: grade com *roving tabindex* (`role="grid"`), setas movem por dia/semana, Home/End vão ao início/fim da semana, Enter abre.
- Frase-resumo abaixo da grade: "O dia que mais pesou foi 5 de nov., com R$ 820,00."

### 4.8 Metas por categoria

- `Section` com título "Metas por categoria", descrição "A partir de 80% do limite a meta entra em alerta.", ação `link` "Ajustar metas".
- Até 5 linhas, ordem: estouradas, em alerta, em dia (por percentual). Cada linha é um `button` → folha da categoria. Conteúdo: bolinha + nome, "R$ 640,00 de R$ 800,00", barra 8px (`statusTone`, animação `fill-in` só na primeira abertura), status com ícone + "80%", à direita "Restam R$ 160,00" ou "Passou R$ 40,00". No mês atual, linha extra `text-caption`: "Cabem R$ 22,00/dia até o fim do mês" (só se restar > 0).
- Se houver mais de 5: link "Ver todas as 8 metas".

### 4.9 Lançamentos recentes

- `Section` com "Lançamentos recentes", "Os últimos movimentos do mês.", ação "Ver todos".
- `TransactionGroups` com 6 itens; **a linha inteira é um botão** que abre `TransactionDialog` em modo edição (`aria-label="Editar Mercado, − R$ 180,00, 12 de nov."`). Depois de salvar, a linha atualizada pisca `brand-soft` (1,2s).

### 4.10 Destaques

Lista `surface` com divisores; cada item com rótulo `eyebrow`, valor `figure` `text-title-sm` e dica `text-caption`. Itens clicáveis têm chevron e são botões:

| Item | Quando aparece | Ação |
|---|---|---|
| Projeção de gastos no fim do mês | mês atual com gasto | rola até o Ritmo e liga a série "Projeção" |
| Média por dia | há gasto | — (não clicável) |
| Maior gasto | há gasto | folha do dia daquele gasto, com a linha marcada |
| Categoria que mais pesou | há gasto | folha da categoria |
| Categoria que mais cresceu (novo) | há comparação e alguma categoria subiu | folha da categoria |

### 4.11 Folha de detalhe: categoria (`?categoria=`)

```
┌ Mercado ───────────────────────────── [×] ┐
│ (M) Gastos de novembro                    │
│ R$ 1.240,00   [↑ +18% vs outubro]         │
│ 22% dos gastos do mês                     │
│ ┌ Meta ────────────────────────────────┐  │
│ │ ███████████████░░░  R$ 1.240 de 1.500 │  │
│ │ ⚠ Atenção, 83%  Restam R$ 260,00      │  │
│ └──────────────────────────────────────┘  │
│ Últimos 6 meses   ▁ ▃ ▂ ▅ ▄ █ (clicáveis)  │
│ Lançamentos (9)                           │
│  Hoje   Pão de Açúcar        − R$ 86,00   │
│  ...                                      │
├───────────────────────────────────────────┤
│ [Novo gasto em Mercado] [Ver em Lançamentos]│
└───────────────────────────────────────────┘
```

- Cabeçalho: avatar com a inicial (cor da categoria), título = nome (`text-title`), subtítulo "Gastos de novembro" / "Receitas de novembro".
- Bloco de números: `Amount` `text-heading`, `Delta`, participação.
- Bloco de meta (só categorias de gasto): `BudgetMeter`; sem meta: texto "Sem meta para Mercado em novembro." + botão `link` "Definir meta" → `/orcamentos?mes=…`.
- Mini-gráfico: barras dos últimos 6 (ou 12, segue `janela`) meses dessa categoria, mês aberto em destaque, linha tracejada `chart-muted` da média; cada barra é um botão (troca o mês mantendo a folha aberta).
- Lista: lançamentos do mês nessa categoria, agrupados por dia, linha clicável → edição.
- Rodapé fixo: `secondary` "Novo gasto em Mercado" (abre o diálogo com tipo e categoria preenchidos) e `primary` "Ver em Lançamentos" → `/lancamentos?mes=…&categoria=…`.

### 4.12 Folha de detalhe: dia (`?dia=`)

- Título "Quinta, 12 de novembro"; subtítulo "Dia 12 de 30".
- Resumo: "Saíram R$ 230,00" / "Entraram R$ 0,00" (com sinais), e "A média por dia no mês é R$ 188,00." (texto com `ArrowUpRight`/`ArrowDownRight` se acima/abaixo).
- Lista dos lançamentos do dia (linha clicável → edição). Se veio de "Maior gasto", a linha correspondente fica marcada (`brand-soft`) e recebe o foco.
- Rodapé: `secondary` "Novo lançamento neste dia" (data preenchida) e `link` "Ver o mês em Lançamentos".

## 5. Estados

| Estado | O que aparece |
|---|---|
| **Carregando (primeira vez)** | Cabeçalho real (saudação, seletor de mês funcionando). Abaixo, esqueleto com as posições finais: rótulo, número (altura de `text-hero`), frase, régua; 4 KPIs; 2 cards de gráfico (288px); 3 blocos de lista. `role="status"`, `aria-busy`, "Carregando o painel". Só depois de 200ms. |
| **Trocando de mês** | Se o mês já estiver em cache: troca direta (número faz a contagem do valor anterior ao novo em `duration-slow`; gráficos fazem a transição de dados em `duration-chart`). Sem cache: o conteúdo atual fica com opacidade 0,6 e `aria-busy="true"`, e uma barra fina de progresso `primary` corre no topo do destaque (classe `progress-indeterminate` do `index.css`, ciclo `--duration-loop`; com movimento reduzido fica parada e cheia a 60%). Sem esqueleto (evita piscar). |
| **Erro geral** | `QueryError` no lugar do conteúdo: "Não foi possível carregar o painel. {mensagem do Supabase em português}" + "Tentar de novo". O seletor de mês continua funcionando. |
| **Erro parcial** | Se só as metas falharem: KPI "Metas" mostra "—" com nota "Não carregou", e o card de metas mostra o erro compacto com "Tentar de novo". O resto funciona. |
| **Conta nova (sem categorias)** | `EmptyState` page: título "Comecem pelas categorias", texto "Elas separam o que entra e o que sai, como Mercado, Aluguel e Salário. Depois é só lançar.", ação "Criar categorias" → `/categorias`. |
| **Mês sem lançamentos** | Faixa `brand-soft` no topo: "Nada lançado em novembro ainda" / "Comecem pela receita do mês e pelos primeiros gastos. O saldo, o ritmo e as metas aparecem logo abaixo." + "Novo lançamento". Destaque "Em novembro R$ 0,00"; gráficos com vazio compacto (copy na seção 7). |
| **Sem receita no mês** | Régua sem preenchimento de receita: só a marca de hoje e a escala; leitura "Ainda não há receita lançada em novembro."; veredito "Lancem a receita do mês para ver quanto ainda sobra." + botão `link` "Lançar receita" (abre o diálogo com tipo Receita). |
| **Mês futuro** | Rótulo "Resumo do mês", número "R$ 0,00", frase "Novembro ainda não começou. Dá para deixar as metas prontas." + `link` "Definir metas". Régua e calendário sem dias passados (todos futuros). |
| **Mês passado** | Verbos no passado ("Sobraram", "Faltaram", "Saíram", "saíram"), sem projeção, régua sem marca de hoje (o cursor percorre o mês inteiro). |
| **Sem comparação** | Delta vira "Sem outubro para comparar" (ou "Sem meses anteriores para a média"); sem linha de comparação nem marca fantasma. |
| **Sucesso após salvar** | Toast "Lançamento atualizado." e linha piscando; os números recalculam (contagem curta no destaque). |
| **Hover / foco / ativo** | Ver cada peça. Todo card clicável: sobe 2px + `shadow-raised`; pressionado `scale .99`; foco com anel `ring` no card inteiro. |
| **Desabilitado** | "Novo lançamento" desabilitado enquanto categorias não carregaram (`quickAdd.ready`), com tooltip "Carregando categorias...". |

## 6. Movimento

| Momento | Animação | Duração / easing | Movimento reduzido |
|---|---|---|---|
| Abertura do painel (1ª vez na sessão) | Régua enche (`fill-in`) e o número conta de 0 ao valor | `duration-hero`, `ease-fluid` | Valor final na hora, régua cheia |
| Troca de mês | Número conta do valor anterior ao novo; gráficos interpolam | `duration-slow` / `duration-chart` | Troca direta |
| Percorrer a régua | Preenchimento recua/avança | `duration-base`, `ease-standard` | Sem transição |
| Destaque cruzado de categoria | Opacidade dos segmentos | `duration-base` | Sem transição |
| Folha abrindo/fechando | Desliza da direita (de baixo no celular) | `duration-slow` entrada, 250ms `ease-exit` saída | Só opacidade |
| Tooltip | `pop-in` | `duration-base` | Sem escala |
| Linha atualizada | Fundo `brand-soft` esmaece (classe `row-flash`) | `--duration-flash` (1200ms), `ease-standard` | Sem esmaecer: fica `--duration-flash-hold` (1s) e some |

Nenhum card entra deslizando. Nenhuma animação em loop.

## 7. Textos (PT-BR, voz "vocês")

**Cabeçalho:** "Bom dia" / "Boa tarde" / "Boa noite"; "Comparar com"; opções "Mês anterior", "Média de 3 meses".

**Destaque:**
- Rótulos: "Saldo livre do mês", "Saldo negativo do mês", "Resumo do mês".
- Verbos: "Sobram", "Sobraram", "Faltam", "Faltaram" (mês passado com saldo negativo, aprovado na revisão), "Já saíram", "Saíram", "Em novembro".
- Frase: "Em novembro entraram R$ 8.000,00 e já saíram R$ 5.660,00."
- Leitura da régua: "Já saiu 71% da receita", "Dia 23 de 30", "Em outubro, nesse dia: 64%", "Na média, nesse dia: 60%".
- Com cursor: "Até 12 de nov.: saíram R$ 2.890,00, 36% da receita", "Em outubro, até o dia 12: R$ 2.400,00".
- Vereditos: "O gasto está atrás do calendário. Dá para respirar." / "O gasto está na frente do calendário. Vale segurar um pouco até o fim do mês." / "Os gastos já passaram do que entrou neste mês." / "Vocês guardaram 29% do que entrou." (mês passado).
- Estouro: "Passou R$ 320,00 da receita".

**KPIs:** "Receitas", "Gastos", "Saldo", "Metas"; "vs outubro", "vs média de 3 meses"; "Sem outubro para comparar"; "Guardaram 29% da receita"; "Gastaram mais do que entrou"; "Sem receita lançada"; "Nenhum limite no mês" + "Definir metas"; "Cabem R$ 96,00/dia até o fim do mês"; "Passou R$ 40,00 do limite".

**Ritmo:** título "Ritmo de gastos"; descrições: "Até aqui, R$ 490,00 a mais que no mesmo ponto de outubro." / "...a menos que..." / "Mesmo ritmo de outubro." / com média: "Até aqui, R$ 300,00 acima da média de 3 meses." / sem comparação: "Quanto já saiu, somado dia a dia ao longo do mês."; vazio: "O ritmo aparece assim que o primeiro gasto for lançado."; legenda: "Este mês", "Projeção", "Outubro", "Média de 3 meses".

**Para onde foi:** "Para onde foi o dinheiro"; "R$ 5.660,00 em gastos, por categoria." / "R$ 8.000,00 em receitas, por categoria."; "Outras (3)"; "Nova neste mês"; vazio gastos: "Nenhum gasto neste mês ainda."; vazio receitas: "Nenhuma receita neste mês ainda."

**Evolução:** "Evolução"; "6 meses", "12 meses"; vazio: "Ainda não há histórico para comparar. Ele aparece a partir do segundo mês com lançamentos."

**Dias do mês:** "Dias do mês"; "Menos", "Mais"; "O dia que mais pesou foi 5 de nov., com R$ 820,00."; tooltip "R$ 230,00 em 3 gastos" / "Nenhum gasto"; vazio: "Os dias ganham cor conforme vocês lançam gastos."

**Metas:** "Metas por categoria"; "A partir de 80% do limite a meta entra em alerta."; "Ajustar metas"; status "Em dia", "Atenção", "Estourada" (os de `budgetStatusLabel`); "Restam R$ 160,00", "Passou R$ 40,00"; "Ver todas as 8 metas"; vazio: "Nenhuma meta para novembro. Definam um limite por categoria para acompanhar aqui." + "Definir metas".

**Recentes:** "Lançamentos recentes"; "Os últimos movimentos do mês."; "Ver todos"; vazio "Nada lançado neste mês." + "Novo lançamento".

**Destaques:** "Destaques"; "O que vale notar neste mês."; "Projeção de gastos no fim do mês", "Nesse ritmo, sobram R$ 1.200,00." / "Nesse ritmo, os gastos passam das receitas."; "Média por dia"; "Maior gasto"; "Categoria que mais pesou"; "Categoria que mais cresceu" → "Lazer, R$ 240,00 a mais que em outubro."

**Folha de categoria:** "Gastos de novembro"; "22% dos gastos do mês"; "Meta"; "Sem meta para Mercado em novembro."; "Definir meta"; "Últimos 6 meses"; "Lançamentos (9)"; "Nada em Mercado em novembro."; "Novo gasto em Mercado"; "Ver em Lançamentos"; Fechar: `aria-label="Fechar"`.

**Folha do dia:** "Quinta, 12 de novembro"; "Dia 12 de 30"; "Saíram R$ 230,00", "Entraram R$ 0,00"; "Acima da média por dia do mês (R$ 188,00)." / "Abaixo da média..."; "Nada lançado neste dia."; "Novo lançamento neste dia"; "Ver o mês em Lançamentos".

**Erros:** "Não foi possível carregar o painel." + mensagem do repository + botão "Tentar de novo"; o sufixo "Confiram a conexão e tentem de novo." só aparece quando a mensagem ainda não orienta (`loadErrorText` em `src/shared/lib/error-copy.ts`: não entra quando o `code` é `network`, `session`, `auth` ou `permission`, nem quando o texto já diz "tentem", "confiram" ou "entrem"), para a mesma orientação nunca aparecer duas vezes; parcial: "As metas não carregaram." + "Tentar de novo"; categoria inexistente na URL: a folha não abre e aparece o toast "Essa categoria não existe mais." (o parâmetro é removido).

## 8. Acessibilidade

- **Estrutura:** `h1` = o destaque ("Sobram R$ 2.340,00"); cada card com `h2`. Regiões: `<section aria-labelledby>` por card. A saudação é `p`, não título.
- **Região viva** única (`aria-live="polite"`, `sr-only`) para: troca de mês ("Painel de outubro de 2026: sobraram R$ 1.800,00"), troca de comparação ("Comparando com a média de 3 meses"), leitura do cursor de dia.
- **Régua:** `role="slider"`, `aria-label="Percorrer o mês dia a dia"`, `aria-valuemin=1`, `aria-valuemax` = último dia passado (ou do mês, se passado), `aria-valuenow` = dia do cursor (hoje, sem cursor), `aria-valuetext="Dia 12: saíram R$ 2.890,00, 36% da receita"`. Teclas: ←/→ 1 dia, PageUp/PageDown 7 dias, Home/End primeiro/último dia, Enter abre a folha do dia, Esc volta para hoje. Arrastar com toque ou mouse (pointer events, `touch-action: pan-y` para não travar a rolagem vertical).
- **Gráficos:** contêiner com `role="group"` e `aria-label` com a frase-resumo; o SVG é `aria-hidden`. Ritmo focável (`tabIndex=0`) com as mesmas teclas da régua. Toda visualização tem "Ver tabela" (`ViewToggle`) com `<table>` real e `<caption>`.
- **Listas clicáveis:** linhas são `button` (ou `a` quando navegam), com `aria-label` completo; o botão não contém outro botão.
- **Legenda-filtro:** `button` com `aria-pressed`; texto diz a série, não só a amostra de cor.
- **Calendário:** `role="grid"`, células `role="gridcell"` com `aria-label="12 de novembro: R$ 230,00 em 3 gastos"`, dias futuros `aria-disabled="true"`, hoje `aria-current="date"`.
- **Folhas:** `role="dialog"`, `aria-modal`, título ligado por `aria-labelledby`; foco vai para o título ao abrir, volta para quem abriu ao fechar; Esc fecha.
- **Cor nunca sozinha:** delta com seta e sinal; status de meta com ícone e palavra; série tracejada para projeção; marca fantasma com rótulo escrito; categorias sempre com nome; calendário com valor no tooltip e na tabela.
- **Toque:** linhas ≥ 48px, botões ≥ 44px, células 44px no celular, setas do seletor 44px.
- **Contraste:** só pares da tabela 3.3 do design system. Texto colorido só sobre `card`/`popover`/`background`/`-soft` da mesma cor.

## 9. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-10 | um mês com receita e gastos | o painel abre | o `h1` mostra o verbo e o saldo ("Sobram R$ 2.340,00"), a régua enche uma vez em ~900ms e o número conta até o valor final |
| UX-11 | `prefers-reduced-motion: reduce` | o painel abre ou troca de mês | o número e a régua aparecem já no valor final, os gráficos não animam e as folhas abrem só com opacidade |
| UX-12 | o mês atual, dia 23, com gasto abaixo do ritmo do calendário | a régua aparece | o preenchimento é `primary`, a marca de hoje fica em 23/30 e o veredito "O gasto está atrás do calendário. Dá para respirar." aparece com ícone |
| UX-13 | o gasto 3 pontos ou mais à frente do calendário | a régua aparece | o preenchimento é `warning` e o veredito de alerta aparece com `TriangleAlert` |
| UX-14 | os gastos passaram da receita | a régua aparece | a barra fica cheia em `expense`, aparece "Passou R$ X da receita" com ícone e o rótulo vira "Saldo negativo do mês" |
| UX-15 | o foco do teclado na régua | aperta → três vezes a partir do dia 9 | o cursor vai ao dia 12, o preenchimento recua ao acumulado do dia 12, a leitura vira "Até 12 de nov.: saíram ..." e o leitor de tela lê o `aria-valuetext` |
| UX-16 | o cursor da régua no dia 12 | aperta Enter | abre a folha do dia 12 e a URL ganha `dia=AAAA-MM-12` |
| UX-17 | o cursor da régua fora de hoje | aperta Esc ou tira o mouse | o cursor volta para hoje e a leitura volta ao resumo |
| UX-18 | o mouse sobre o dia 15 no Ritmo de gastos | o cursor se move | a régua mostra o cursor no dia 15 (sincronizados) e o tooltip mostra acumulado, comparação, gasto no dia e a diferença com seta |
| UX-19 | o Ritmo de gastos visível | clica num dia do gráfico | abre a folha daquele dia |
| UX-20 | a legenda do Ritmo com três séries ligadas | clica em "Outubro" | a linha de outubro some do gráfico e do tooltip, o botão fica `aria-pressed="false"`; com só uma série ligada, ela não pode ser desligada |
| UX-21 | `comparar=anterior` | escolhe "Média de 3 meses" | a URL troca para `comparar=media` (sem nova entrada no histórico), os deltas dizem "vs média de 3 meses", a linha de comparação e a marca fantasma passam a usar a média e a região viva anuncia a troca |
| UX-22 | nenhum dos 3 meses anteriores tem lançamento | escolhe "Média de 3 meses" | os deltas mostram "Sem meses anteriores para a média" e não há linha de comparação |
| UX-23 | o card Gastos | clica nele (ou Enter com foco) | vai para `/lancamentos?mes=…&tipo=gastos` |
| UX-24 | o card Metas sem nenhuma meta | aparece | mostra "—", "Nenhum limite no mês" e "Definir metas"; o clique leva a `/orcamentos?mes=…` |
| UX-25 | o mouse sobre a linha "Mercado" em "Para onde foi" | passa por cima | o segmento de Mercado na faixa fica em 100% e os outros em 35% |
| UX-26 | a linha "Mercado" | clica ou Enter | abre a folha de Mercado, com `categoria=<id>` na URL, total, delta, participação, meta, mini-gráfico e lançamentos do mês |
| UX-27 | a folha de categoria aberta | clica numa barra de setembro no mini-gráfico | o painel vai para setembro e a folha continua aberta mostrando setembro |
| UX-28 | a folha aberta | aperta Esc, clica no véu ou usa o Voltar do navegador | a folha fecha, o parâmetro sai da URL e o foco volta para a linha que a abriu |
| UX-29 | alguém abre um link com `categoria=<id>` | a página carrega | o painel aparece com a folha daquela categoria já aberta |
| UX-30 | `categoria` aponta para uma categoria excluída | a página carrega | a folha não abre, o parâmetro sai da URL e aparece "Essa categoria não existe mais." |
| UX-31 | a linha "Outras (3)" | clica | a lista se expande (`aria-expanded="true"`) com as 3 categorias, cada uma clicável |
| UX-32 | "Para onde foi" em Gastos | escolhe "Receitas" | a faixa e a lista mostram as categorias de receita e a descrição diz "em receitas" |
| UX-33 | uma categoria sem valor na comparação | aparece na lista | o delta dela diz "Nova neste mês" |
| UX-34 | o gráfico de Evolução | aperta Tab até o rótulo "Set" e Enter | o painel abre setembro (nova entrada no histórico), rola ao topo e anuncia "Painel de setembro de 2026" |
| UX-35 | `janela=6` (ou sem o parâmetro) | escolhe "12 meses" | o gráfico mostra 12 colunas sem nova carga de rede visível (dados já buscados) e a URL ganha `janela=12` |
| UX-36 | o calendário "Dias do mês" com o foco no dia 12 | aperta ↓ | o foco vai ao dia 19 e o tooltip mostra o valor do dia 19 |
| UX-37 | o calendário no mês atual | aparece | os dias futuros ficam em `sunken`, sem foco nem clique, e o dia de hoje tem contorno |
| UX-38 | uma meta estourada e uma em dia | o card de metas aparece | a estourada vem primeiro, com ícone `CircleX`, "Estourada" e "Passou R$ X" |
| UX-39 | uma linha em Lançamentos recentes | clica | abre o diálogo de edição; ao salvar, toast "Lançamento atualizado." e a linha pisca em `brand-soft` |
| UX-40 | o destaque "Maior gasto" | clica | abre a folha do dia do gasto com a linha dele marcada e focada |
| UX-41 | a folha do dia | clica em "Novo lançamento neste dia" | abre o diálogo de lançamento com a data daquele dia preenchida |
| UX-42 | um mês sem lançamentos | o painel abre | aparece a faixa "Nada lançado em {mês} ainda" com "Novo lançamento", e cada gráfico mostra o vazio compacto com o texto da seção 7 |
| UX-43 | uma conta sem categorias | o painel abre | aparece "Comecem pelas categorias" com o botão "Criar categorias" levando a `/categorias` |
| UX-44 | a carga falha | o painel tenta carregar | aparece "Não foi possível carregar o painel." com a mensagem e "Tentar de novo"; o seletor de mês continua funcionando |
| UX-45 | só a consulta de metas falha | o painel carrega | os outros cards aparecem normalmente e o card de metas mostra "As metas não carregaram." com "Tentar de novo" |
| UX-46 | trocar para um mês sem cache | a carga demora | o conteúdo atual fica a 60% com `aria-busy="true"` e uma barra fina de progresso; sem esqueleto piscando |
| UX-47 | qualquer gráfico | clica em "Ver tabela" | aparece uma `<table>` com cabeçalhos e `<caption>`, com os mesmos números do gráfico |
| UX-48 | só teclado, em qualquer largura | percorre o painel com Tab | a ordem segue a visual (cabeçalho → régua → KPIs → Para onde foi → Ritmo → Metas → Recentes → Dias do mês → Evolução → Destaques), não há `order-*` mudando a ordem e todo elemento focado mostra o anel `ring` |
| UX-49 | tela de 375px | o painel abre | não há rolagem horizontal da página, os toques têm ≥ 44px (células do calendário ≥ 40px) e a ordem das seções é a mesma do DOM e do desktop |

## 10. Notas de implementação

- Estado de interação compartilhado em `DashboardContent`: `activeDay` (régua ↔ ritmo), `hoveredCategoryId` (faixa ↔ lista). Folhas e comparação vêm da URL.
- Novos hooks: `usePrefersReducedMotion`, `useCountUp(value, { duration })`, `useDashboardParams()` (lê/escreve `comparar`, `janela`, `categoria`, `dia`).
- Regras novas de cálculo (média de 3 meses, variação por categoria, série de uma categoria, lançamentos de um dia) entram em `insights.ts` com teste ao lado.
- Os layouts de laboratório (`/painel/comando`, `/painel/fluxo`, `/painel/atlas`) e o submenu deles **saem** quando este painel entrar (ver dúvida em aberto no resumo).
- Dependências sugeridas (o engenheiro decide e instala): `@radix-ui/react-tooltip` e `@radix-ui/react-popover`. A folha usa o `@radix-ui/react-dialog` que já existe. Não precisa de biblioteca de animação.
