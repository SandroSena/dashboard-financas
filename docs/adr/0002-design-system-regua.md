# ADR-0002: Design system "Régua"

- **Status:** Aceito (2026-11-23)
- **Data:** 2026-11-23 (proposto e aceito no mesmo dia, após a implementação e as revisões de código, segurança e design)
- **Quem decide:** designer (direção visual); frontend-engineer aplica

## Contexto

O usuário pediu para refazer o visual com um design system e deixar o painel mais bonito e interativo, com liberdade total de direção. O visual atual (preto puro, cards `#121212`, teal 500) tinha três problemas medidos: no tema claro, o botão principal (branco sobre `#0d9488`, 3,74:1), os textos de receita (`#16a34a`, 3,3:1) e de alerta (`#d97706`, 3,2:1) reprovam WCAG AA; as cores de categoria incluíam verde, vermelho e âmbar, que o produto reserva para significado; e não havia tokens de tipografia, movimento, espaço nem paleta de gráficos.

## Decisão

1. Manter `src/index.css` como única fonte dos tokens, em três camadas (base, semântica claro/escuro, `@theme inline`), preservando os nomes atuais.
2. Neutros com o matiz da marca ("tinta" no escuro, "névoa" no claro) em vez de preto e cinza puros.
3. Teal 700 para ação e link no claro; teal 500 continua no escuro e no logo. Verde, rosa e âmbar passam para os tons que passam 4,5:1 em cada tema.
4. Paleta de categorias com 8 cores nomeadas e duas versões (claro/escuro), sem os tons reservados. O banco continua guardando um hex, que vira identificador do slot; cores antigas são mapeadas no frontend, sem migração.
5. Bricolage Grotesque + Figtree mantidas; escala tipográfica de terça maior; rótulos em caixa normal.
6. Tokens de movimento (6 durações, 3 easings) e uma regra: só a régua e o número do destaque animam sozinhos, uma vez.
7. A régua do mês vira o elemento interativo central do painel; drill-down em folha lateral com estado na URL.
8. Dependências sugeridas: `@radix-ui/react-tooltip` e `@radix-ui/react-popover` (mesma família do Radix já usado). Nenhuma biblioteca de animação.

## Consequências

- O claro fica um pouco mais escuro nos tons de cor (mais legível); o escuro ganha um leve tom esverdeado.
- Categorias existentes podem mudar de cor visualmente (ex.: verde vira ciano); o diálogo de edição avisa.
- Os layouts de laboratório do painel (Comando, Fluxo, Atlas) deixam de ser necessários.
- Detalhes: `docs/design/design-system.md` e `docs/design/telas/`.

## Decisões finais (implementação e revisões, 2026-11-23)

As decisões 1 a 7 valem como escritas. Ajustes e fechamentos:

- **Labs removidos**: Comando, Fluxo e Atlas saíram do produto; o calendário de gastos do Atlas virou o card "Dias do mês", pintado com a escala `seq-1` a `seq-5`.
- **Janela 6/12 em `?janela`** no gráfico de evolução (padrão 6). A régua e o destaque continuam sendo do mês aberto.
- **Comparação com a média de 3 meses com lançamento** (`?comparar=media`): entram até os 3 meses anteriores, só os que tiveram lançamento. O padrão é o mês anterior.
- **Drill-down em folha com estado na URL** (decisão 7): `?categoria=<id>` e `?dia=AAAA-MM-DD`, uma folha por vez.
- **Ordem única do DOM no painel**: leitura e Tab na mesma ordem em todas as larguras, sem `order-*`.
- **Dependências** (ajusta a decisão 8): entraram `@radix-ui/react-tooltip`, `@radix-ui/react-popover` e também `@radix-ui/react-toggle-group` (base do `Segmented`, com setas e foco itinerante), com versão exata. Nenhuma biblioteca de animação.
- **Regras conferidas na revisão**: nenhum hex, `shadow-[` ou `duration-[` em `.tsx`; cores de categoria por `var(--cat-*)`; `recharts` só em `src/features/painel/charts/`; animação do Recharts desligada por `usePrefersReducedMotion`.
- Fora do visual, mas na mesma entrega: CSP aplicada direto (sem Report-Only, por decisão do usuário), com o script de tema em `public/theme-init.js`, e `search_path = ''` nas funções do banco (migração de hardening). Detalhes no ADR-0001.

Visão geral do código resultante: `docs/ARQUITETURA.md`, seção "Visual".
