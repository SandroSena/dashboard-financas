# Shell e navegação (`src/app/app-shell.tsx`)

Tokens e componentes: `docs/design/design-system.md` (10.12 Navegação, 10.1 Button, 10.13 Toast).

## 1. Propósito

Deixar as quatro áreas (Painel, Lançamentos, Orçamentos, Categorias) e a ação mais frequente (**Novo lançamento**) sempre a um toque, mantendo o mês escolhido (`?mes=`) ao trocar de tela.

## 2. Fluxo

- **Entrada:** qualquer rota autenticada. Sem sessão → `/entrar`.
- **Navegação:** cada link do menu leva `?mes=` atual. Os outros parâmetros (`comparar`, `categoria`, `tipo`) são da tela e **não** viajam entre telas.
- **Novo lançamento:** botão no menu lateral, botão central na barra de baixo e atalho de teclado **N** (quando o foco não está num campo). Abre o `TransactionDialog`; ao salvar, toast "Lançamento adicionado." e a tela atual se atualiza.
- **Sair:** botão "Sair" → encerra a sessão → `/entrar`. Erro → toast com a mensagem e a pessoa continua logada.
- **Recuperação:** rota desconhecida → painel (já é assim).

## 3. Layout

### Desktop (≥ 768px)

```
┌────────────┬─────────────────────────────────────────────┐
│ (o) Finanças│                                             │
│            │   conteúdo (max-w-6xl; painel: --content-wide)│
│ [+ Novo    │                                             │
│  lançamento]│                                            │
│            │                                             │
│ ▣ Painel   │                                             │
│ ▤ Lançamentos│                                           │
│ ◎ Orçamentos│                                            │
│ ⌂ Categorias│                                            │
│            │                                             │
│ ┌────────┐ │                                             │
│ │(S) email│ │                                            │
│ │ ☀  ⇥   │ │                                             │
│ └────────┘ │                                             │
└────────────┴─────────────────────────────────────────────┘
```

- Coluna fixa de 248px, `background`, sem borda (a separação vem do conteúdo em cards). `sticky top-0 h-svh`.
- Logo: `BrandMark` (fundo `brand-mark`, desenho em `brand-mark-foreground`, igual nos dois temas) + "Finanças" em `text-title-sm` Bricolage.
- Botão "Novo lançamento" `primary` `lg`, largura total, com a dica de atalho "N" à direita (`kbd` com `text-caption`, fundo `primary-foreground/15`, `aria-hidden`; o botão tem `aria-keyshortcuts="n"`).
- Links: 44px, `rounded-control`, ícone 18px + rótulo `text-body` 500. Ativo: fundo `card`, `shadow-edge`, ícone `brand`, `aria-current="page"`. Hover: fundo `card/60`.
- **O submenu de variantes do painel (Resumo/Comando/Fluxo/Atlas) sai.**
- Rodapé: card `card` `rounded-control` com avatar (inicial, `brand-soft`/`brand`), e-mail truncado (`text-caption muted-foreground`, `title` com o e-mail inteiro), `ThemeToggle` e "Sair" (ícones 40px com tooltip).

### Celular (< 768px)

- **Cabeçalho fixo** (56px): logo + "Finanças" à esquerda; tema e sair à direita (44px). Fundo `background/80` com desfoque; ganha fio `border` embaixo depois de rolar 8px.
- **Barra de baixo flutuante:** `inset-x-3`, `bottom: max(12px, safe-area)`, `card/95` com desfoque, `rounded-card`, `shadow-raised`. Cinco posições: Painel, Lançamentos, **[+]**, Orçamentos, Categorias. Destinos com ícone em pílula 48×28 (ativa em `brand-soft`) + rótulo `text-caption` 500; altura total de toque ≥ 48px. Botão central 56px `primary`, `rounded-full`, `aria-label="Novo lançamento"`.
- Conteúdo com `pb-28` para não ficar sob a barra; `scroll-padding-bottom` garante que o foco não fique escondido.

### Link de pular

Primeiro elemento focável: "Pular para o conteúdo", escondido até receber foco, aparece no topo à esquerda como botão `primary` `sm`. Leva ao `<main id="conteudo" tabIndex={-1}>`.

## 4. Seletor de mês (`MonthPicker`, substitui `MonthSwitcher`)

```
[ ‹ ] [ Novembro de 2026 ▾ ] [ › ]   Voltar para hoje
            │
            ▼ popover
      ┌ 2026            ‹  › ┐
      │ Jan  Fev  Mar        │
      │ ▂    ▃    ▅          │
      │ Abr  Mai  Jun        │
      │ ...                  │
      └──────────────────────┘
```

- Grupo `rounded-full` em `card` com `shadow-edge`: botão anterior (40px; 44px no toque, `aria-label="Mês anterior"`), botão central com o mês (`text-body-sm` 600, largura mínima 9rem, abre o popover, `aria-haspopup="dialog"`, `aria-expanded`), botão próximo (`aria-label="Próximo mês"`).
- "Voltar para hoje": botão `link` que só aparece fora do mês atual.
- **Popover** (`@radix-ui/react-popover`, `popover` + `shadow-overlay`, `rounded-control`, `pop-in`): ano com setas, grade 3×4 de meses (botões 44px, `text-body-sm`). Cada mês mostra uma barrinha de 3px com o gasto relativo **quando o histórico já carregado tiver o dado** (no painel); em outras telas, sem barrinha. Mês aberto: `primary`/`primary-foreground`; mês atual: contorno `ring`; meses com dados: texto `foreground`; sem dados: `muted-foreground`.
- Teclado: no popover, setas movem entre meses, Enter escolhe, Esc fecha e devolve o foco ao botão central. Atalhos globais (fora de campos): **[** mês anterior, **]** próximo mês.
- Troca de mês: `push` no histórico (Voltar volta ao mês anterior). Região viva anuncia "Novembro de 2026".
- No celular, o seletor ocupa a largura toda da tela, com o botão central flexível.

## 5. Estados

| Estado | Comportamento |
|---|---|
| Categorias carregando | "Novo lançamento" desabilitado (`opacity .45`), tooltip "Carregando categorias..."; atalho N não faz nada |
| Sem categorias | "Novo lançamento" abre o diálogo, que mostra "Nenhuma categoria de gasto. Criem uma em Categorias." com link para `/categorias` |
| Saindo | Botão "Sair" com `aria-busy` e ícone girando; demais ações desabilitadas |
| Erro ao sair | Toast "Não foi possível sair. {mensagem}" |
| Hover / foco / ativo | Links: hover `card/60`; foco anel `ring`; ativo `card` + ícone `brand`; pressionado `scale .97` |
| Troca de rota | `page-in` (opacidade, `duration-base`); com movimento reduzido, troca direta |

## 6. Textos

"Finanças"; "Novo lançamento"; "Painel", "Lançamentos", "Orçamentos", "Categorias"; "Sair"; "Usar tema claro" / "Usar tema escuro"; "Pular para o conteúdo"; "Mês anterior", "Próximo mês", "Voltar para hoje", "Escolher mês"; navegação: `aria-label="Principal"`; títulos da aba: "Painel | Finanças", "Lançamentos | Finanças"...

## 7. Acessibilidade

- Dois `<nav aria-label="Principal">` (lateral e de baixo) nunca aparecem juntos (um fica `hidden` por breakpoint), então não há duplicata para o leitor de tela.
- `aria-current="page"` no link ativo; ícones `aria-hidden`.
- Atalhos (N, [, ]) ignorados quando o foco está em `input`, `select`, `textarea` ou dentro de diálogo; anunciados via `aria-keyshortcuts`.
- Ordem de foco: pular → logo → Novo lançamento → links → conta → conteúdo.
- Todos os botões só de ícone com `aria-label` e tooltip de controle.

## 8. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-01 | qualquer tela autenticada com `?mes=2026-09` | clica em "Lançamentos" no menu | vai para `/lancamentos?mes=2026-09` e o link fica com `aria-current="page"` |
| UX-02 | o foco fora de campos e categorias carregadas | aperta N | abre o diálogo "Novo lançamento" |
| UX-03 | o foco num campo de texto | aperta N | a letra é digitada e nenhum diálogo abre |
| UX-04 | o seletor de mês | clica no nome do mês | abre o popover com os 12 meses do ano, o mês aberto destacado; setas movem, Enter escolhe, Esc fecha e devolve o foco |
| UX-05 | um mês que não é o atual | o seletor aparece | aparece "Voltar para hoje", que leva ao mês atual |
| UX-06 | tela de 375px | rola até o fim da página | o último item fica visível acima da barra de baixo e nenhum foco fica escondido sob ela |
| UX-07 | só teclado, logo após carregar | aperta Tab uma vez | aparece "Pular para o conteúdo"; Enter leva o foco ao conteúdo principal |
| UX-08 | o menu lateral | o painel abre | não existe mais o submenu Resumo/Comando/Fluxo/Atlas |
| UX-09 | a barra de baixo no celular | mede os destinos | cada destino e o botão central têm ≥ 48px de altura de toque, com rótulo visível |
