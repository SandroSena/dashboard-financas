# Lançamentos (`/lancamentos`)

Tokens e componentes: `docs/design/design-system.md` (10.4 Field, 10.5 Dialog, 10.6 Segmented, 10.11 Listas).

## 1. Propósito

Ver, encontrar e corrigir tudo o que entrou e saiu no mês. É o destino dos cliques do painel ("Gastos", "Ver em Lançamentos"), então **os filtros vêm da URL**.

## 2. Fluxo

- **Entrada:** menu; card de KPI do painel (`?tipo=gastos|receitas`); folha de categoria (`?categoria=<id>`); "Ver todos" em Lançamentos recentes; link direto.
- **Passos:** escolhe o mês → filtra por tipo, categoria ou texto → toca numa linha para editar, ou usa os botões da linha → salva ou exclui.
- **Saída:** fica na tela (é uma tela de trabalho). Toast confirma cada ação.
- **Recuperação:** erro de carga → "Tentar de novo"; erro ao salvar → toast e o diálogo continua aberto com o que foi digitado; exclusão por engano → toast com **"Desfazer"** por 6s (recria o lançamento com os mesmos dados; viável no frontend com `create`).

### Estado na URL

| Parâmetro | Valores | Padrão |
|---|---|---|
| `mes` | `AAAA-MM` | mês atual |
| `tipo` | `todos`, `gastos`, `receitas` | `todos` |
| `categoria` | id | todas |
| `busca` | texto | vazio |

Filtros usam `replace` (não enchem o histórico). Trocar o tipo limpa a categoria se ela não for do novo tipo.

## 3. Layout

### Desktop (≥ 768px)

```
Lançamentos                                     [‹ Novembro de 2026 ›]
Tudo o que entrou e saiu no mês, dia a dia.

[Todos|Gastos|Receitas]  [Categoria ▾        ]  [🔍 Buscar descrição  ×]

┌ Gastos ─────────┐ ┌ Receitas ───────┐ ┌ Saldo ──────────┐
│ − R$ 5.660,00   │ │ + R$ 8.000,00   │ │ + R$ 2.340,00   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
45 lançamentos na lista                      Filtros: Mercado × | Limpar filtros

┌──────────────────────────────────────────────────────────────┐
│ Hoje                                             − R$ 230,00 │
│ (M) Pão de Açúcar          Mercado        − R$ 86,00   ✎  🗑 │
│ ...                                                          │
│ qui., 12 nov.                                    − R$ 410,00 │
└──────────────────────────────────────────────────────────────┘
```

- Filtros numa linha: `Segmented` (tipo), `NativeSelect` (categoria, até 18rem), busca (até 20rem, fundo `sunken`).
- Totais: 3 tiles `surface`, `space-inset-md`, rótulo `eyebrow`, valor `figure` `text-title` com sinal e cor (`expense`, `income`, saldo por sinal).
- Abaixo dos totais: contagem (`text-caption`) e **chips dos filtros ativos** (Badge `neutral` com botão × de 28px, área de toque 44px) + "Limpar filtros" (`link`).
- Lista: `TransactionGroups` com cabeçalho de dia mostrando o total do dia à direita. Ações da linha (Editar, Excluir) visíveis a 60% de opacidade, 100% no hover/foco da linha; ícones 40px com tooltip.

### Celular (< 768px)

- Título `text-heading`; seletor de mês em largura total.
- Filtros: `Segmented` em largura total; abaixo, categoria e busca lado a lado (50/50); a busca recolhe para um botão-ícone "Buscar" (44px) que expande o campo ao tocar.
- Totais: 3 tiles numa linha, valor `text-body` 600 (sem centavos menores se não couber: usar `formatCompactBrl` só acima de R$ 100 mil).
- Lista: **a linha inteira abre a edição** (não há botões na linha). "Excluir lançamento" fica dentro do diálogo de edição (botão `ghost` com texto `destructive` no rodapé, à esquerda).

## 4. Diálogo de lançamento (novo e edição)

- Título "Novo lançamento" / "Editar lançamento"; descrição "Onde o dinheiro foi, quanto e quando."
- Ordem: Tipo (`Segmented` Gasto/Receita, com tom) → **Valor** primeiro (campo grande `numeral` 24px, foco inicial aqui) → Onde foi → Categoria → Data.
- **Categoria como chips** quando houver até 8 categorias do tipo (radiogroup com bolinha de cor + nome, 40px, quebra em linhas); acima de 8, `NativeSelect`. A última categoria usada no tipo vem pré-selecionada em lançamento novo.
- Data com atalhos "Hoje" e "Ontem" (botões `secondary` `sm`) ao lado do campo.
- Pré-preenchimentos vindos do painel: `kind`, `categoryId`, `occurredOn`.
- Ações: "Cancelar" (`ghost`) e "Adicionar lançamento" / "Salvar alterações" (`primary`); em edição, "Excluir lançamento" à esquerda.
- Enter no último campo envia. Erros aparecem embaixo de cada campo e o foco vai para o primeiro inválido.

## 5. Estados

| Estado | O que aparece |
|---|---|
| Carregando | Filtros ativos; esqueleto dos 3 totais e de 6 linhas de lista (56px) com 2 cabeçalhos de dia |
| Erro | `QueryError`: "Não foi possível carregar os lançamentos." + mensagem + "Tentar de novo" |
| Mês vazio | `EmptyState` page: "Nenhum lançamento em novembro" / "Adicionem um gasto ou uma receita para ver o total do mês." + "Novo lançamento" |
| Filtro sem resultado | `EmptyState` filter: "Nada com esses filtros" / "Troquem o tipo, a categoria ou a busca para ver outros movimentos." + "Limpar filtros" |
| Categoria da URL inexistente | Filtro de categoria ignorado e removido da URL; toast "Essa categoria não existe mais." |
| Salvando | Botão "Salvando..." com spinner, campos desabilitados |
| Sucesso | Toast "Lançamento adicionado." / "Lançamento atualizado."; a linha nova ou editada pisca `brand-soft`; se a data for de outro mês, o toast diz "Lançamento adicionado em outubro." com ação "Ver outubro" |
| Excluir | `ConfirmDialog` "Excluir lançamento?" / "Mercado, R$ 86,00, sai da soma de novembro." / "Excluir"; depois, toast "Lançamento excluído." com "Desfazer" |
| Hover / foco | Linha: fundo `accent/50`, ações a 100%; foco na linha (celular: linha é botão) com anel |

## 6. Textos

Título "Lançamentos"; descrição "Tudo o que entrou e saiu no mês, dia a dia."; filtros "Todos", "Gastos", "Receitas", "Todas as categorias", busca `placeholder="Buscar pela descrição"` com rótulo `sr-only` "Buscar lançamentos"; "Limpar busca"; "45 lançamentos na lista" / "1 lançamento na lista"; "Limpar filtros"; cabeçalhos "Hoje", "Ontem", "qui., 12 nov."; ações "Editar Pão de Açúcar", "Excluir Pão de Açúcar"; validações do `schema.ts` (já em PT-BR): "Informem onde o dinheiro foi.", "Informem o valor.", "Informem um valor maior que zero, com até duas casas.", "Escolham uma categoria.", "Informem uma data válida."

## 7. Acessibilidade

- Totais em `<dl>` (já é). A busca filtra enquanto digita (debounce 150ms) e anuncia "12 lançamentos na lista" via região viva.
- Lista: `ul` por dia com o cabeçalho do dia como `h3` (`text-label`), para navegação por títulos.
- No celular, cada linha é um `button` com `aria-label="Editar Pão de Açúcar, Mercado, − R$ 86,00, 12 de nov."`.
- Chips de categoria do diálogo: `role="radiogroup"` com *roving tabindex*; a cor é acompanhada do nome.
- "Desfazer" no toast é alcançável por teclado (o Sonner foca com Alt+T; anunciar no texto do toast).

## 8. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-50 | o link `/lancamentos?mes=2026-11&tipo=gastos` | a tela abre | o segmentado mostra "Gastos" e a lista só tem gastos de novembro |
| UX-51 | `categoria=<id de Mercado>` na URL | a tela abre | o select mostra Mercado, aparece o chip "Mercado ×" e a lista só tem Mercado |
| UX-52 | filtros ativos | clica em "Limpar filtros" | os filtros voltam ao padrão, os chips somem e a URL fica só com `mes` |
| UX-53 | a busca | digita "farm" | em até 150ms a lista mostra só descrições com "farm" (sem diferenciar acento e maiúscula) e a contagem é anunciada |
| UX-54 | filtros que não retornam nada | a lista atualiza | aparece "Nada com esses filtros" com "Limpar filtros" |
| UX-55 | o diálogo de novo lançamento | abre | o foco está no campo Valor e a última categoria usada no tipo já vem marcada |
| UX-56 | o diálogo com Valor vazio | clica em "Adicionar lançamento" | aparece "Informem o valor." embaixo do campo, ele fica `aria-invalid` e recebe o foco |
| UX-57 | um lançamento salvo com data de outubro estando em novembro | salva | o toast diz "Lançamento adicionado em outubro." com a ação "Ver outubro" |
| UX-58 | um lançamento excluído | o toast aparece | "Desfazer" recria o lançamento com os mesmos dados e ele volta à lista |
| UX-59 | tela de 375px | toca numa linha | abre a edição; "Excluir lançamento" está no rodapé do diálogo |
| UX-60 | desktop, só teclado | Tab chega a uma linha | os botões Editar e Excluir ficam 100% visíveis e cada um tem `aria-label` com a descrição |
| UX-61 | a carga falha | a tela abre | aparece "Não foi possível carregar os lançamentos." com "Tentar de novo" |
