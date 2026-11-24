# Entrar e criar conta (`/entrar`, `/criar-conta`) e tela de configuração

Tokens e componentes: `docs/design/design-system.md` (10.1 Button, 10.4 Field). Arquivos: `features/auth/auth-shell.tsx`, `login-page.tsx`, `signup-page.tsx`, `config-page.tsx`.

## 1. Propósito

Entrar rápido (e-mail e senha) e, na primeira visita, entender em uma frase o que o app faz, com a régua do mês como ilustração da ideia.

## 2. Fluxo

- **Entrada:** qualquer rota sem sessão → `/entrar`; link "Criar conta"; link "Entrar" na criação.
- **Entrar:** e-mail → senha → "Entrar" → `/painel` (com `?mes` do mês atual). Se veio de um link protegido (ex.: `/painel?mes=2026-09&categoria=…`), volta para ele depois de entrar.
- **Criar conta:** e-mail → senha (com "Mostrar senha", sem campo de confirmação) → "Criar conta". Se o Supabase exigir confirmação de e-mail, mostra a tela de "Confira seu e-mail" (estado de sucesso); senão, entra direto.
- **Recuperação:** credenciais erradas → mensagem acima do botão, campos mantêm o e-mail, a senha é limpa e recebe o foco; sem rede → mensagem com "Tentar de novo" implícito (o botão volta a funcionar); e-mail já cadastrado → mensagem com link "Entrar com esse e-mail".
- **Sem Supabase configurado** (`config-page.tsx`): tela única explicando o que falta, sem formulário.

## 3. Layout

### Desktop (≥ 1024px)

```
┌───────────────────────────────────┬───────────────────────────┐
│ (o) Finanças            (.dark)   │                       ☀   │
│                                   │  Que bom ver vocês        │
│ O mês da casa, num lugar só.      │  Entrem para ver como     │
│ Anotem cada gasto, vejam o saldo  │  está o mês.              │
│ andar e saibam quanto ainda cabe  │                           │
│ em cada categoria.                │  E-mail [              ]  │
│                                   │  Senha  [           👁 ]  │
│ Já saiu 54% da receita Dia 19 de 30│  [        Entrar       ]  │
│ ███████████░░░░│░░░░░░░           │                           │
│ O gasto está atrás do calendário. │  Primeira vez? Criar conta│
└───────────────────────────────────┴───────────────────────────┘
```

- Painel esquerdo (`1.1fr`): **sempre no tema escuro**, aplicando a classe `dark` no próprio painel (some o hex cru atual: `#eaf6f4`, `bg-black`, `#22c55e`). Fundo `background`, texto `foreground`; frase em `text-display` Bricolage (`opsz` 96) até 3 linhas; apoio em `text-lead muted-foreground`.
- **Régua ilustrativa animada uma vez:** preenchimento `primary` (a mesma cor da régua do painel quando o gasto está no ritmo; nunca `income`, que é receita), enche até 54% (`fill-in`), a marca de hoje entra em 63%, e o texto "O gasto está atrás do calendário. Dá para respirar." aparece depois. É a única animação da tela; com movimento reduzido, já aparece pronta. `aria-hidden` (é ilustração).
- Painel direito: formulário em coluna de 24rem, centrado, título `text-display` (40px), subtítulo `text-body muted-foreground`. Tema no canto.

### Celular / tablet (< 1024px)

- Só o formulário. Logo + "Finanças" acima do título; abaixo do formulário, a régua ilustrativa compacta (altura 10px, sem texto animado), também em `primary` com a frase "O mês da casa, num lugar só." em `text-body-sm muted-foreground`.
- Campos de 48px; botão `lg` em largura total; teclado: `type="email"`, `autoComplete` corretos, `enterKeyHint="go"` na senha.

## 4. Estados

| Estado | O que aparece |
|---|---|
| Repouso | Foco inicial no e-mail |
| Validação | Erros do Zod embaixo de cada campo, ao enviar e depois ao sair do campo (`onBlur` após a primeira tentativa) |
| Enviando | Botão "Entrando..." / "Criando conta..." com spinner, campos desabilitados |
| Erro do servidor | Caixa `expense-soft` com ícone `CircleAlert` e texto `expense`, `role="alert"`, acima do botão |
| Sucesso (entrar) | Vai para o destino; sem toast |
| Sucesso (criar, com confirmação) | O formulário é trocado por: ícone `MailCheck` em `brand-soft`, título "Confiram o e-mail", texto "Mandamos um link para ana@exemplo.com. Abram o link para ativar a conta e depois entrem por aqui.", botão `outline` "Voltar para entrar" |
| Configuração ausente | Título "Falta conectar o banco", texto com as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `code`, link para o `README` |

## 5. Textos

- Entrar: título "Que bom ver vocês"; subtítulo "Entrem para ver como está o mês."; "E-mail"; "Senha"; "Mostrar senha"/"Esconder senha"; botão "Entrar"; rodapé "Primeira vez aqui? Criar conta".
- Criar conta: título "Vamos começar"; subtítulo "Uma conta para a casa toda acompanhar o mês."; "E-mail"; "Senha" com ajuda visível "Pelo menos 8 caracteres." (regra do `schema.ts`); botão "Criar conta"; rodapé "Já têm conta? Entrar".
- Erros (mapear as mensagens do Supabase em `errorMessage`): "E-mail ou senha não conferem. Confiram e tentem de novo."; "Esse e-mail já tem conta. Entrar com esse e-mail"; "Sem conexão com o servidor. Confiram a internet e tentem de novo."; validação (já no `schema.ts`): "Informem o e-mail.", "Informem um e-mail válido.", "A senha precisa ter pelo menos 8 caracteres."
- Painel esquerdo: "O mês da casa, num lugar só." / "Anotem cada gasto, vejam o saldo andar e saibam quanto ainda cabe em cada categoria antes do mês acabar."

## 6. Acessibilidade

- `h1` = título do formulário. A frase do painel esquerdo é `p` (o painel é decorativo para leitura, mas o texto é lido).
- Erro de servidor com `role="alert"`; erros de campo ligados por `aria-describedby`; o foco vai para o primeiro campo inválido.
- Botão de mostrar senha 40px com `aria-pressed` e `aria-label` (já existe).
- Contraste: o painel esquerdo usa tokens do escuro (tabela 3.3), nada de opacidade sobre hex.

## 7. Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| UX-90 | `/entrar` no desktop | abre | o painel esquerdo está no tema escuro mesmo com o app no claro, a régua enche uma vez e o foco está no e-mail |
| UX-91 | `prefers-reduced-motion` | `/entrar` abre | a régua já aparece cheia, sem animação |
| UX-92 | senha errada | clica em "Entrar" | aparece "E-mail ou senha não conferem..." acima do botão, o e-mail continua preenchido e a senha fica vazia e com foco |
| UX-93 | e-mail inválido | envia | aparece "Informem um e-mail válido." embaixo do campo, com `aria-invalid` |
| UX-94 | alguém abriu `/painel?mes=2026-09` sem sessão | entra com sucesso | volta para `/painel?mes=2026-09` |
| UX-95 | criar conta com confirmação de e-mail ligada | envia | o formulário vira "Confiram o e-mail" com o endereço digitado e "Voltar para entrar" |
| UX-96 | a tela de criar conta | abre | a ajuda "Pelo menos 8 caracteres." aparece embaixo da senha antes de qualquer erro, ligada por `aria-describedby` |
| UX-97 | tela de 375px | `/entrar` abre | só o formulário aparece, com campos de 48px e a régua compacta abaixo |
| UX-98 | o código de `auth-shell.tsx` | é revisado | não há hex cru; o painel usa a classe `dark` e tokens |
