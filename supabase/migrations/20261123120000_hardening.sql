-- Hardening (auditoria de segurança de nov/2026, itens H-02 e H-03).
--
-- 1. Tira do papel `anon` (quem não está logado) todos os privilégios nas três
--    tabelas e nos objetos que forem criados depois no schema public. Hoje só o
--    RLS segura o `anon`; com o revoke, ele leva "permission denied" antes mesmo
--    de chegar nas políticas. O app só usa o papel `authenticated`.
-- 2. Fixa `search_path = ''` nas quatro funções. Todas já qualificam os nomes
--    (`public.categories`, `public.transaction_kind`) e as funções nativas
--    (pg_catalog) continuam visíveis com search_path vazio, então nada muda no
--    comportamento.
--
-- É idempotente: rodar de novo não muda nada nem dá erro.
--
-- Como desfazer (rode no SQL Editor):
--   grant select, insert, update, delete, truncate, references, trigger
--     on public.categories, public.transactions, public.budgets to anon;
--   alter default privileges in schema public grant all on tables to anon;
--   alter default privileges in schema public grant all on sequences to anon;
--   alter default privileges in schema public grant all on functions to anon;
--   alter default privileges for role postgres grant execute on functions to public;
--   alter function public.enforce_transaction_category() reset search_path;
--   alter function public.enforce_budget_category() reset search_path;
--   alter function public.lock_category_identity() reset search_path;
--   alter function public.handle_new_user() set search_path = public;
--
-- Observação: `alter default privileges` vale para os objetos criados pelo papel
-- que roda a migração (no SQL Editor, `postgres`). Objetos criados por outro
-- papel seguem os default privileges desse outro papel.
--
-- Funções (V-02 da re-revisão): o EXECUTE em funções novas chega por dois
-- caminhos, e cada um precisa do seu revoke:
--   a) o grant global do Postgres a PUBLIC. Default privilege "in schema" só
--      soma ao global e não consegue tirá-lo (doc do ALTER DEFAULT PRIVILEGES),
--      então o revoke é global: `for role postgres`, sem `in schema`. Vale para
--      as funções que o `postgres` criar em qualquer schema daqui em diante.
--   b) o grant direto que o Supabase faz a anon/authenticated/service_role em
--      public. O revoke "in schema public ... from anon" desfaz só a parte do
--      anon; authenticated e service_role continuam com EXECUTE explícito.
-- Consequência: função nova que o anon precise chamar exige
-- `grant execute on function ... to anon` explícito. Funções criadas pelo
-- `postgres` fora de public (ex.: num schema próprio) também ficam sem EXECUTE
-- para os papéis da API até receberem grant explícito.
-- Não muda nada nas funções que já existem: default privileges só valem para
-- objetos criados depois. As quatro funções daqui são de trigger, e o Postgres
-- confere EXECUTE só no `create trigger`, não quando o trigger dispara; de
-- qualquer forma elas não são chamáveis por RPC (função de trigger só roda
-- como trigger). As funções internas do Supabase (auth, storage, extensões)
-- pertencem a supabase_admin/supabase_auth_admin e não são afetadas.

-- H-02: privilégios do anon
revoke all on table public.categories, public.transactions, public.budgets from anon;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
alter default privileges for role postgres revoke execute on functions from public;

-- H-03: search_path fixo
alter function public.enforce_transaction_category() set search_path = '';
alter function public.enforce_budget_category() set search_path = '';
alter function public.lock_category_identity() set search_path = '';
alter function public.handle_new_user() set search_path = '';
