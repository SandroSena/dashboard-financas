-- Finanças pessoais: categorias, lançamentos, orçamentos e RLS.
-- Rode este arquivo no SQL Editor do Supabase (uma vez por projeto).

create type public.transaction_kind as enum ('expense', 'income');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind public.transaction_kind not null,
  color text not null,
  created_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint categories_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index categories_user_kind_name_idx
  on public.categories (user_id, kind, lower(name));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  kind public.transaction_kind not null,
  description text not null,
  amount numeric(12, 2) not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  constraint transactions_description_length check (char_length(btrim(description)) between 1 and 120),
  constraint transactions_amount_positive check (amount > 0)
);

create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null,
  limit_amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint budgets_month_first_day check (extract(day from month) = 1),
  constraint budgets_limit_positive check (limit_amount > 0),
  constraint budgets_user_category_month_key unique (user_id, category_id, month)
);

create index budgets_user_month_idx
  on public.budgets (user_id, month);

create or replace function public.enforce_transaction_category()
returns trigger
language plpgsql
as $$
declare
  category_user uuid;
  category_kind public.transaction_kind;
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'Não é permitido transferir o registro';
  end if;

  select user_id, kind
    into category_user, category_kind
  from public.categories
  where id = new.category_id;

  if category_user is null or category_user <> new.user_id then
    raise exception 'Categoria inválida';
  end if;

  if category_kind <> new.kind then
    raise exception 'O tipo do lançamento precisa ser o mesmo da categoria';
  end if;

  return new;
end;
$$;

create trigger transactions_category_check
  before insert or update on public.transactions
  for each row execute function public.enforce_transaction_category();

create or replace function public.enforce_budget_category()
returns trigger
language plpgsql
as $$
declare
  category_user uuid;
  category_kind public.transaction_kind;
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'Não é permitido transferir o registro';
  end if;

  select user_id, kind
    into category_user, category_kind
  from public.categories
  where id = new.category_id;

  if category_user is null or category_user <> new.user_id then
    raise exception 'Categoria inválida';
  end if;

  if category_kind <> 'expense' then
    raise exception 'Orçamento só vale para categorias de gasto';
  end if;

  return new;
end;
$$;

create trigger budgets_category_check
  before insert or update on public.budgets
  for each row execute function public.enforce_budget_category();

create or replace function public.lock_category_identity()
returns trigger
language plpgsql
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'Não é permitido transferir o registro';
  end if;

  if new.kind <> old.kind then
    raise exception 'O tipo da categoria não pode ser alterado';
  end if;

  return new;
end;
$$;

create trigger categories_lock_identity
  before update on public.categories
  for each row execute function public.lock_category_identity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, kind, color)
  values
    (new.id, 'Alimentação', 'expense', '#f97316'),
    (new.id, 'Moradia', 'expense', '#6366f1'),
    (new.id, 'Transporte', 'expense', '#0ea5e9'),
    (new.id, 'Saúde', 'expense', '#14b8a6'),
    (new.id, 'Lazer', 'expense', '#ec4899'),
    (new.id, 'Educação', 'expense', '#8b5cf6'),
    (new.id, 'Assinaturas', 'expense', '#eab308'),
    (new.id, 'Card Games', 'expense', '#0891b2'),
    (new.id, 'Outros', 'expense', '#64748b'),
    (new.id, 'Salário', 'income', '#16a34a'),
    (new.id, 'Freelance', 'income', '#22c55e'),
    (new.id, 'Outros rendimentos', 'income', '#84cc16');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy categories_select on public.categories
  for select to authenticated
  using (auth.uid() = user_id);

create policy categories_insert on public.categories
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy categories_update on public.categories
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy categories_delete on public.categories
  for delete to authenticated
  using (auth.uid() = user_id);

create policy transactions_select on public.transactions
  for select to authenticated
  using (auth.uid() = user_id);

create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy transactions_update on public.transactions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy transactions_delete on public.transactions
  for delete to authenticated
  using (auth.uid() = user_id);

create policy budgets_select on public.budgets
  for select to authenticated
  using (auth.uid() = user_id);

create policy budgets_insert on public.budgets
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy budgets_update on public.budgets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy budgets_delete on public.budgets
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke all on function public.enforce_transaction_category() from public, anon;
revoke all on function public.enforce_budget_category() from public, anon;
revoke all on function public.lock_category_identity() from public, anon;
grant execute on function public.enforce_transaction_category() to authenticated;
grant execute on function public.enforce_budget_category() to authenticated;
grant execute on function public.lock_category_identity() to authenticated;
