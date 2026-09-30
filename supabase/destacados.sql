-- =====================================================================
-- ClinVi — Migración 005: Profesionales destacados (plan de visibilidad)
-- Ejecutar DESPUÉS de schema.sql, en Supabase → SQL Editor → Run.
-- Idempotente. No modifica datos existentes: todos arrancan en nivel 0.
--
-- destacado_nivel: 0 = sin destacar · 1 = Destacado · 2 = Destacado Plus · 3 = Destacado Premium
--
--   * Solo un ADMIN puede cambiarlo. Si un profesional lo intenta (aunque
--     manipule la petición), la base conserva el valor anterior.
--   * NO modifica rating ni reseñas: la puntuación sigue siendo solo de pacientes.
--   * El buscador muestra primero a los destacados (mayor nivel primero) y la
--     app los identifica con un distintivo visible.
-- =====================================================================

alter table public.profesionales
  add column if not exists destacado_nivel smallint not null default 0;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profesionales_destacado_nivel_check') then
    alter table public.profesionales
      add constraint profesionales_destacado_nivel_check check (destacado_nivel between 0 and 3);
  end if;
end $$;

-- Protección: igual criterio que protect_profesional_fields (schema.sql).
create or replace function public.protect_destacado_nivel()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.destacado_nivel := 0;
  else
    new.destacado_nivel := old.destacado_nivel;
  end if;
  return new;
end $$;

drop trigger if exists a_protect_destacado on public.profesionales;
create trigger a_protect_destacado
  before insert or update on public.profesionales
  for each row execute function public.protect_destacado_nivel();

-- Orden del buscador: activos, destacados primero, luego mejor puntuación.
create index if not exists profesionales_destacado_rating_idx
  on public.profesionales (estado, destacado_nivel desc, rating desc, resenas_count desc);

-- Verificación rápida: distribución de niveles (todos en 0 recién aplicada).
select destacado_nivel, count(*) as profesionales
from public.profesionales
group by destacado_nivel
order by destacado_nivel desc;
