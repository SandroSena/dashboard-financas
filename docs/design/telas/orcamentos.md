# Orçamentos (`/orcamentos`)

Tokens e componentes: `docs/design/design-system.md` (10.4 Field, 10.10 KPI, 10.11 Listas). O medidor é o `BudgetMeter` com `statusTone`.

## 1. Propósito

Definir quanto pode sair em cada categoria de gasto no mês e ver, num relance, quais estão em dia (< 80%), em alerta (80% a 99%, rótulo "Atenção") ou estouradas (≥ 100%), e quanto ainda cabe por dia. Regra única para o app todo (`budgetStatus` em `orcamentos/model.ts`); o exemplo antigo "Mercado 83% Em dia" estava errado e foi corrigido na revisão.

## 2. Fluxo

- **Entrada:** menu; card "Metas" do painel; "Ajustar metas" e "Definir meta" no painel e na folha de categoria (`?mes=`, opcionalmente `&categoria=<id>`, que rola até a linha e foca o campo).
- **Passos:** escolhe o mês → digita o limite de uma categoria → Enter ou "Salvar". Para um mês novo: "Copiar metas de outubro".
- **Saída:** fica na tela; toast confirma. Nome da categoria é link para a folha da categoria no painel (`/painel?mes=…&categoria=…`).
- **Recuperação:** valor inválido → erro embaixo do campo (não toast); erro ao salvar → toast e o valor digitado continua no campo; cópia parcial (algumas falharam) → toast "4 de 6 metas copiadas. Tentem de novo para as que faltaram." com "Tentar de novo".

## 3. Layout

### Desktop

```
Orçamentos                                         [‹ Novembro de 2026 ›]
Quanto pode sair em cada categoria neste mês.

┌ Total das metas ─┬ Já saiu ─────────┬ Ainda cabe ───────────────────┐
│ R$ 4.800,00      │ R$ 3.760,00  78% │ R$ 1.040,00   R$ 148,00/dia   │
│ ██████████████████████████████████░░░░░░░░  (barra geral)           │
└──────────────────┴──────────────────┴───────────────────────────────┘
[Todas (8) | Estouradas (1) | Em alerta (2) | Em dia (5)]    [Copiar metas de outubro]

┌────────────────────────────────────────────────────────────────────┐
│ (M) Mercado                     Gasto R$ 1.240,00  │ R$ [1.500,00 ] │
│ ███████████████████░░░░  ⚠ Atenção, 83%  Restam R$ 260,00         │
│ Cabem R$ 37,00/dia até o fim do mês    Média de 3 meses: R$ 1.380 [Usar] │
└────────────────────────────────────────────────────────────────────┘
```

- **Resumo** (card `static`): três números (`eyebrow` + `figure` `text-title`), barra geral 10px com `statusTone` do total, "R$ X/dia" só no mês atual.
- **Filtro de status** (`Segmented` com contagem) + botão `secondary` "Copiar metas de {mês anterior}" (só aparece se o mês aberto não tiver nenhuma meta e o anterior tiver).
- **Linhas:** card por categoria, `md:grid-cols-[1fr_15rem]`. Esquerda: avatar/bolinha + nome (link), "Gasto R$ X", medidor, status com ícone, restante/passou, "Cabem R$ X/dia" (mês atual, se restar > 0). Direita: campo "Meta de Mercado" com prefixo R$ e o botão Salvar/Remover, que aparece só quando o valor muda (já é assim; manter o espaço reservado para não pular).
- **Sugestão** (quando a categoria não tem meta e teve gasto nos 3 meses anteriores): texto `text-caption` "Média de 3 meses: R$ 1.380,00" + botão `link` "Usar" que preenche o campo (não salva sozinho). Calculado no frontend com o histórico de 3 meses (`useTransactionsBetween`).
- Ordem das linhas: estouradas, alerta, em dia, sem meta (por nome).

### Celular

- Resumo com os três números empilhados em 2 colunas (Total e Já saiu na primeira linha, Ainda cabe embaixo em largura total).
- Filtro de status rola na horizontal dentro do trilho (sem quebrar a página), com sombra de borda indicando mais opções.
- Linha empilhada: cabeçalho, medidor, campo + botão em largura total.

## 4. Estados

| Estado | O que aparece |
|---|---|
| Carregando | Esqueleto do resumo + 5 linhas |
| Erro | `QueryError` "Não foi possível carregar os orçamentos." + "Tentar de novo" |
| Sem categorias de gasto | `EmptyState`: "Nenhuma categoria de gasto" / "As metas são por categoria. Criem uma categoria de gasto para começar." + "Criar categoria" → `/categorias` |
| Mês sem metas | Resumo substituído por faixa `brand-soft`: "Nenhuma meta em novembro" / "Escrevam um limite ao lado de cada categoria. A partir de 80% a meta entra em alerta." + "Copiar metas de outubro" (se houver) |
| Filtro sem itens | "Nenhuma meta estourada em novembro." (ou "em alerta") em `EmptyState` compact |
| Campo inválido | Embaixo do campo: "Informem uma meta maior que zero, com até duas casas." (`aria-invalid`) |
| Salvando | Botão "Salvando..."; campo continua editável |
| Sucesso | Toast "Meta salva." / "Meta removida." / "6 metas copiadas de outubro."; o medidor anima a nova largura (`scaleX`, `duration-slow`) |
| Hover / foco | Linha sem hover (não é clicável); campo com estados do Field; nome com sublinhado no hover |

## 5. Textos

Título "Orçamentos"; descrição "Quanto pode sair em cada categoria neste mês."; ajuda do campo (`text-caption`, uma vez no topo da lista): "Apaguem o valor para tirar a meta."; resumo "Total das metas", "Já saiu", "Ainda cabe", "R$ 148,00/dia", "Passou R$ 120,00" (quando negativo, em `expense` com ícone); filtros "Todas", "Estouradas", "Em alerta", "Em dia"; "Copiar metas de outubro"; status "Em dia", "Atenção", "Estourada"; "Restam R$ 260,00", "Passou R$ 40,00"; "Cabem R$ 37,00/dia até o fim do mês"; "Sem meta. Escrevam um valor para começar a acompanhar."; "Média de 3 meses: R$ 1.380,00", "Usar"; "Salvar", "Remover".

## 6. Acessibilidade

- Campo com rótulo acessível "Meta de Mercado" e `aria-describedby` apontando para o status ("Atenção, 83% da meta").
- Medidor `role="progressbar"` com `aria-valuenow` limitado a 100 e `aria-valuetext="83% da meta, atenção"` (abaixo de 80%: "62% da meta, em dia") (acima de 100: "120% da meta, estourada").
- Botão Salvar invisível não recebe foco (já é assim) e o espaço dele fica reservado.
- Filtro de status: `Segmented` com contagem no rótulo.
- Vindo com `&categoria=`, a linha rola para a vista (respeitando `scroll-padding`) e o campo recebe o foco.

## 7. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-80 | metas no mês atual | a tela abre | o resumo mostra total, já saiu com %, ainda cabe e "R$ X/dia" |
| UX-81 | uma meta de R$ 500 e gasto de R$ 600 | a linha aparece | o medidor fica cheio em `expense`, o status é "Estourada" com `CircleX` e o texto diz "Passou R$ 100,00"; a linha vem antes das outras |
| UX-82 | o campo de uma categoria | digita "abc" e Enter | aparece o erro embaixo do campo, `aria-invalid`, e nada é salvo |
| UX-83 | o campo com meta existente | apaga o valor | o botão vira "Remover" (`outline`); ao confirmar, toast "Meta removida." |
| UX-84 | novembro sem metas e outubro com 6 | clica em "Copiar metas de outubro" | as 6 metas aparecem em novembro e o toast diz "6 metas copiadas de outubro." |
| UX-85 | uma categoria sem meta com gasto nos 3 meses anteriores | a linha aparece | mostra "Média de 3 meses: R$ X" e "Usar" preenche o campo sem salvar |
| UX-86 | o link `/orcamentos?mes=…&categoria=<id>` | a tela abre | a linha da categoria rola para a vista e o campo dela tem o foco |
| UX-87 | o filtro "Em alerta" sem itens | é escolhido | aparece "Nenhuma meta em alerta em novembro." |
| UX-88 | sem categorias de gasto | a tela abre | aparece o vazio com "Criar categoria" levando a `/categorias` |
