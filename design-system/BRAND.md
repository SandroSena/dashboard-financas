# Marca — Dashboard Finanças

<!--
Marca do produto: fonte da verdade para nome, cores, fontes, logo e tom de voz.
Mantida pelo designer, só com valores escolhidos pelo usuário. Neste projeto o design system
("Régua") fica em docs/design/design-system.md (decisão em docs/adr/0002-design-system-regua.md)
e os tokens em src/index.css; este arquivo guarda só a marca e não é gerado por ferramenta.
-->

## Como usar

- Estes valores são a fonte da verdade da marca. O `designer` os traduz para o design system "Régua" (`docs/design/design-system.md`) e para os tokens em `src/index.css` (`@theme`); os engenheiros usam os **tokens**, nunca os valores abaixo diretamente. Não existe `design-system/<projeto>/MASTER.md` nem `tokens.json` neste projeto.
- Se um campo estiver `_a definir_`, **não** invente um valor em silêncio: o `designer` propõe opções (com o `ui-ux-pro-max` e um playground), o usuário escolhe e este arquivo é atualizado.
- Nunca aplique a marca de outra empresa.

## Identidade

| Item | Valor |
|------|-------|
| Nome da marca / produto | Dashboard Finanças |
| Posicionamento em uma frase | O mês da casa, num lugar só. |
| Personalidade (3 adjetivos) | _a definir_ |

## Cores

| Papel | Hex | Uso |
|-------|-----|-----|
| Primária | #14B8A6 | Ações principais, links, destaques |
| Secundária | _a definir_ | Acentos de apoio |
| Neutra escura | "Tinta" (neutros levemente puxados para o teal): fundo `#070C0B`, superfícies `#0E1514` / `#141D1C`, texto `#E6EEEC` | Tema escuro (o padrão): fundos, superfícies e texto. Tokens `background`, `card`, `popover`, `foreground` |
| Neutra clara | "Névoa" (cinza frio, mesmo matiz): fundo `#F1F5F4`, superfície `#FFFFFF`, texto `#0C1917` | Tema claro. Mesmos tokens semânticos |
| Sucesso / Aviso / Erro | Receita/em dia: verde `#22C55E` (escuro) / `#15803D` (claro). Alerta: âmbar `#F59E0B` / `#B45309`. Gasto/estouro/erro: rosa `#FB7185` / `#BE123C` | Tokens `income`, `warning`, `expense`/`destructive`, com versões `-soft`. Reservados ao significado: nunca usados como cor de categoria; sempre com sinal, ícone ou texto (contraste validado na tabela 3.3 do design system) |

## Tipografia

| Papel | Fonte | Alternativa |
|-------|-------|-------------|
| Títulos | Bricolage Grotesque | sans-serif do sistema |
| Texto | Figtree | sans-serif do sistema |
| Código / números | Figtree com algarismos tabulares (`font-variant-numeric: tabular-nums`, utilitário `figure`); o número grande do painel usa Figtree proporcional (`numeral-hero`) | sans-serif do sistema (não usar fonte mono para números) |

As fontes precisam ser carregadas pela aplicação (hospedadas no projeto ou por um serviço de fontes escolhido em um ADR); nunca conte com fontes instaladas no computador do usuário.

## Logo

- Arquivos: _a definir_ (ex.: `public/brand/logo.svg`, `logo-dark.svg`, `icon.svg`)
- Área de respiro e tamanho mínimo: _a definir_
- Nunca estique, recolora fora da paleta nem coloque sobre fundos de baixo contraste.

## Voz e tom

| Item | Valor |
|------|-------|
| Idioma | português |
| Formalidade | Amigável e direta, fala com a casa no plural: "vocês" ("Que bom ver vocês", "Lancem a receita do mês") |
| Faça | Frases curtas, verbo na frente, caixa de frase. Botão diz a ação e o aviso repete o verbo ("Adicionar lançamento" → "Lançamento adicionado."). Erro diz o que houve e o que fazer ("Confiram a conexão e tentem de novo."). Vazio convida a agir. |
| Evite | "Você"/"tente novamente" (mistura a voz), jargão técnico (SQL, "erro 500"), pedir desculpas, rótulos em CAIXA ALTA, "Sem dados" sem uma ação, exclamações em excesso. |

## Aplicando a marca

- **Interface**: valores da marca → tokens de design em `src/index.css` (`--color-primary`, `--font-display`, …) → componentes. Confira o contraste de cada par texto/fundo.
- **Gráficos**: cores primária e secundária nas séries principais e neutras no resto; nunca dependa só da cor.
- **Documentos / slides / e-mails**: títulos na fonte de títulos, texto na fonte de texto, acentos só da paleta.
