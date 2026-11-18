-- Inclui Card Games nas contas novas e nas que já existem.

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

insert into public.categories (user_id, name, kind, color)
select users.id, 'Card Games', 'expense', '#0891b2'
from auth.users as users
where not exists (
  select 1
  from public.categories as categories
  where categories.user_id = users.id
    and categories.kind = 'expense'
    and lower(categories.name) = 'card games'
);
