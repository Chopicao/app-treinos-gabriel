-- ---------------------------------------------------------------------------
-- Base de dados da aplicação de treinos.
--
-- Cola este ficheiro inteiro no SQL Editor do Supabase e carrega em "Run".
-- Podes voltar a correr sem problema: tudo é idempotente.
--
-- Desenho:
--  * Cada linha pertence a um utilizador (`user_id`) e a segurança é garantida
--    por Row Level Security: uma conta nunca consegue ler nem escrever linhas
--    de outra, mesmo que alguém use a chave pública da aplicação.
--  * Os registos são guardados como JSONB, com a mesma forma que a aplicação já
--    usa localmente. Assim o modelo local e o remoto não divergem.
--  * As eliminações são suaves (`deleted_at`), para que apagar num dispositivo
--    se propague em vez de a linha reaparecer vinda do outro.
-- ---------------------------------------------------------------------------

-- Sessões de treino ---------------------------------------------------------
create table if not exists public.sessions (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  id             text        not null,
  occurrence_key text        not null,
  session_date   date        not null,
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  data           jsonb       not null,
  primary key (user_id, id)
);

create index if not exists sessions_user_updated_idx
  on public.sessions (user_id, updated_at desc);

-- Remarcações de ocorrências ------------------------------------------------
create table if not exists public.overrides (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  data       jsonb       not null,
  primary key (user_id, key)
);

create index if not exists overrides_user_updated_idx
  on public.overrides (user_id, updated_at desc);

-- Perfil do atleta (uma linha por conta) ------------------------------------
create table if not exists public.profiles (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  data       jsonb       not null
);

-- Definições da aplicação (uma linha por conta) -----------------------------
create table if not exists public.settings (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  data       jsonb       not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.sessions  enable row level security;
alter table public.overrides enable row level security;
alter table public.profiles  enable row level security;
alter table public.settings  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['sessions', 'overrides', 'profiles', 'settings'] loop
    execute format('drop policy if exists "ler as proprias linhas" on public.%I', t);
    execute format('drop policy if exists "inserir as proprias linhas" on public.%I', t);
    execute format('drop policy if exists "atualizar as proprias linhas" on public.%I', t);
    execute format('drop policy if exists "apagar as proprias linhas" on public.%I', t);

    execute format(
      'create policy "ler as proprias linhas" on public.%I
         for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "inserir as proprias linhas" on public.%I
         for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "atualizar as proprias linhas" on public.%I
         for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "apagar as proprias linhas" on public.%I
         for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- `updated_at` é sempre carimbado pelo servidor.
--
-- Sem isto, um dispositivo com o relógio errado podia ganhar sempre a
-- resolução de conflitos (que é "vence a escrita mais recente").
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['sessions', 'overrides', 'profiles', 'settings'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format(
      'create trigger touch_updated_at before insert or update on public.%I
         for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Verificação rápida: deve devolver 4 tabelas, todas com RLS ligado.
-- ---------------------------------------------------------------------------
select
  c.relname                                             as tabela,
  c.relrowsecurity                                      as rls_ligado,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('sessions', 'overrides', 'profiles', 'settings')
order by c.relname;
