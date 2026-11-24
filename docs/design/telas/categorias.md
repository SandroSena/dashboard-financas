# Categorias (`/categorias`)

Tokens e componentes: `docs/design/design-system.md` (4.2 Paleta categórica, 10.5 Dialog, 10.6 Tabs).

## 1. Propósito

Organizar como a casa separa o que entra e o que sai, e escolher a cor que vai identificar cada categoria nos gráficos. Mostra também quanto cada categoria movimentou no mês atual, para a lista não ser só um cadastro.

## 2. Fluxo

- **Entrada:** menu; estado vazio do painel ("Criar categorias"); aviso do diálogo de lançamento ("Criem uma em Categorias").
- **Passos:** escolhe a aba (Gastos/Receitas) → "Nova categoria" → nome e cor → salva. Ou toca numa categoria → edita nome/cor. Ou exclui.
- **Saída:** fica na tela. Da linha, "Ver lançamentos" leva a `/lancamentos?mes=<atual>&categoria=<id>`.
- **Recuperação:** exclusão bloqueada (categoria com lançamentos, erro `23503`) → a confirmação fecha e o toast explica o que fazer, com ação "Ver lançamentos"; nome repetido (`23505`) → erro embaixo do campo Nome.

Aba na URL: `?tipo=gastos|receitas` (padrão `gastos`, `replace`).

## 3. Layout

### Desktop

```
Categorias                                            [+ Nova categoria]
Como vocês separam o que entra e o que sai.

[Gastos (9) | Receitas (3)]

┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────
│ (M) Mercado          ✎ ⋯ │ │ (A) Aluguel          ✎ ⋯ │ │ ...
│     R$ 1.240,00 em nov.  │ │     R$ 2.000,00 em nov.  │ │
│     9 lançamentos        │ │     1 lançamento         │ │
└──────────────────────────┘ └──────────────────────────┘ └──────────
```

- Grade `sm:2 xl:3` colunas, `space-gutter`. Cada item é um card `static` (`space-inset-md`, `rounded-card`): avatar 40px com a inicial (fundo `color-mix` 16% da cor + inicial na cor), nome `text-body` 600, linha `text-caption muted-foreground` com total do mês atual e contagem ("Nada em novembro" quando zero). Ordem: maior total do mês primeiro; empate por nome.
- Ações: "Editar" (ícone 40px) e menu "Mais ações" (`⋯`) com "Ver lançamentos" e "Excluir" (texto `destructive`). Sem menu de biblioteca nova: usar o Popover sugerido no shell, ou dois botões visíveis se o engenheiro preferir não adicionar dependência.
- A descrição da página perde a frase longa; a regra "o tipo não muda depois" vai para dentro do diálogo, onde importa.

### Celular

- Lista em uma coluna; o card inteiro é um botão que abre a edição. "Excluir" fica no rodapé do diálogo de edição. "Nova categoria" vira botão `primary` em largura total abaixo do título.

## 4. Diálogo de categoria

- Título "Nova categoria" / "Editar categoria". Descrição: nova → "Escolham o tipo, o nome e uma cor."; edição → "O tipo continua o mesmo, para não misturar o histórico."
- Tipo (só na criação): `Segmented` Gasto/Receita, pré-selecionado pela aba.
- Nome: `TextInput`, até 40 caracteres (`schema.ts`), com contador `text-caption` a partir de 30.
- **Cor:** grade de 8 amostras (as cores da paleta 4.2 do design system, na ordem Azul, Roxo, Laranja, Fúcsia, Ouro, Ciano, Café, Ardósia). Cada amostra é um rádio de 44px, círculo de 28px na cor do **tema atual** (`var(--cat-*)`), selecionada com anel 2px `foreground` + ícone `Check` em `card`; o nome da cor aparece embaixo da grade ("Cor: Laranja") e no `aria-label`.
- **Prévia** ao vivo: uma linha de lançamento de exemplo com o avatar e uma barra de gráfico na cor escolhida, para ver como fica nos dois contextos.
- Categoria antiga com cor fora da paleta: aparece com a cor do slot mapeado já selecionada e o aviso `text-caption` "A cor foi ajustada para a paleta nova. Salvem para confirmar."

## 5. Estados

| Estado | O que aparece |
|---|---|
| Carregando | Esqueleto de 6 cards (altura final) |
| Erro | `QueryError` "Não foi possível carregar as categorias." + "Tentar de novo" |
| Vazio (aba) | `EmptyState` page: Gastos → "Nenhuma categoria de gasto" / "Criem categorias como Mercado, Casa e Transporte para separar os gastos." + "Nova categoria"; Receitas → "Nenhuma categoria de receita" / "Criem categorias como Salário e Extras." + "Nova categoria" |
| Salvando | Botão "Salvando..." |
| Sucesso | Toast "Categoria criada." / "Categoria atualizada."; o card novo pisca `brand-soft` |
| Excluir | `ConfirmDialog` "Excluir Mercado?" / "Dá para excluir só se ela não tiver lançamentos. As metas dessa categoria também saem." / "Excluir" |
| Exclusão bloqueada | Toast de erro: "Mercado tem lançamentos e não pode ser excluída. Mudem esses lançamentos de categoria ou excluam-nos antes." + ação "Ver lançamentos" |
| Nome repetido | Erro no campo: "Já existe uma categoria com esse nome." |

## 6. Acessibilidade

- Tabs Radix com contagem no rótulo ("Gastos, 9 categorias" no `aria-label`).
- Amostras de cor: `role="radiogroup"` `aria-label="Cor"`, cada `role="radio"` com `aria-label="Laranja"`; setas movem; a cor nunca é a única pista (nome escrito embaixo).
- Botões só de ícone com `aria-label` ("Editar Mercado", "Mais ações para Mercado").
- Toques ≥ 44px; no celular o card inteiro é o alvo.

## 7. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-70 | categorias de gasto com lançamentos no mês | a aba Gastos abre | cada card mostra o total e a contagem do mês atual, do maior para o menor |
| UX-71 | o diálogo de nova categoria | abre | aparecem as 8 amostras com nome, a primeira marcada, e a prévia na cor marcada |
| UX-72 | o foco na grade de cores | aperta → | a próxima cor fica marcada, a prévia muda e "Cor: Roxo" é lido |
| UX-73 | tema escuro | o diálogo mostra a amostra Azul | ela usa `--cat-azul` do escuro (`#60A5FA`), e o valor gravado continua `#2563EB` |
| UX-74 | uma categoria antiga com `#16a34a` | o diálogo de edição abre | a amostra Ciano está marcada e aparece o aviso de cor ajustada |
| UX-75 | uma categoria com lançamentos | confirma a exclusão | aparece o toast explicando o bloqueio com "Ver lançamentos", que leva a `/lancamentos?mes=…&categoria=…` |
| UX-76 | um nome já existente | salva | aparece "Já existe uma categoria com esse nome." embaixo do campo, com foco nele |
| UX-77 | a aba Receitas vazia | abre | aparece "Nenhuma categoria de receita" com "Nova categoria", que abre o diálogo já com tipo Receita |
| UX-78 | tela de 375px | toca num card | abre a edição, com "Excluir categoria" no rodapé |
