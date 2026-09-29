-- =====================================================================
-- ClinVi — Migración 003: Coberturas médicas (lista maestra + relación)
-- Ejecutar DESPUÉS de schema.sql y motivos_consulta.sql,
-- en Supabase → SQL Editor → Run.
-- Idempotente: se puede ejecutar varias veces sin duplicar ni borrar datos.
--
-- Qué cambia:
--   + Tabla coberturas (lista maestra: obras sociales, prepagas, particular).
--   + Tabla profesional_coberturas (profesional ↔ cobertura, sin límite).
--   + Triggers de normalización y validación.
--   + Función set_profesional_coberturas (único camino de escritura para profesionales).
--   + Trigger de registro: vincula las coberturas elegidas en el alta.
--   + Políticas RLS.
--   = NO modifica ni borra tablas existentes (profesionales, motivos, turnos, etc.).
--   = NO carga datos: la carga inicial está en supabase/coberturas_import.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.coberturas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null
    check (tipo in ('obra_social_nacional', 'obra_social_provincial', 'prepaga', 'otra')),
  nombre text not null check (char_length(trim(nombre)) between 2 and 160),
  sigla text check (sigla is null or char_length(trim(sigla)) between 1 and 40),
  provincia text check (provincia is null or provincia in (
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán')),
  activo boolean not null default true,
  notas text check (notas is null or char_length(notas) <= 500),
  -- De dónde salió el registro: la carga inicial (CSV) o un alta del panel admin.
  origen text not null default 'admin' check (origen in ('csv_inicial', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coberturas_provincial_con_provincia
    check (tipo <> 'obra_social_provincial' or provincia is not null)
);

-- Identidad: nombre (sin mayúsculas ni acentos) + provincia.
-- Permite "OSEP" en Catamarca y en Mendoza; impide duplicados accidentales.
create unique index if not exists coberturas_identidad_uidx
  on public.coberturas (public.normalizar(nombre), coalesce(provincia, ''));

-- La sigla NO es única globalmente (OSEP, IPS se repiten entre provincias),
-- pero no puede repetirse dentro de la misma provincia (o entre las nacionales).
create unique index if not exists coberturas_sigla_provincia_uidx
  on public.coberturas (public.normalizar(sigla), coalesce(provincia, ''))
  where sigla is not null;

create index if not exists coberturas_tipo_activo_idx on public.coberturas (tipo, activo);
create index if not exists coberturas_provincia_idx on public.coberturas (provincia) where provincia is not null;

create table if not exists public.profesional_coberturas (
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  cobertura_id uuid not null references public.coberturas(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profesional_id, cobertura_id)
);
-- La PK cubre búsquedas por profesional; este índice cubre el filtro del buscador.
create index if not exists profesional_coberturas_cobertura_idx
  on public.profesional_coberturas (cobertura_id, profesional_id);

-- ---------------------------------------------------------------------
-- 2. Normalización de coberturas
-- ---------------------------------------------------------------------
create or replace function public.coberturas_guard()
returns trigger language plpgsql as $$
begin
  new.nombre := trim(regexp_replace(new.nombre, '\s+', ' ', 'g'));
  new.sigla := nullif(trim(regexp_replace(coalesce(new.sigla, ''), '\s+', ' ', 'g')), '');
  new.provincia := nullif(trim(coalesce(new.provincia, '')), '');
  new.notas := nullif(trim(coalesce(new.notas, '')), '');
  if tg_op = 'UPDATE' then
    -- El origen es histórico: no se reescribe.
    new.origen := old.origen;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists a_guard_coberturas on public.coberturas;
create trigger a_guard_coberturas
  before insert or update on public.coberturas
  for each row execute function public.coberturas_guard();

drop trigger if exists updated_at_coberturas on public.coberturas;
create trigger updated_at_coberturas
  before update on public.coberturas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Validación de vínculos: solo coberturas existentes y ACTIVAS
--    (aplica también a inserciones de un admin o de la importación).
-- ---------------------------------------------------------------------
create or replace function public.validar_profesional_cobertura()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_activo boolean;
begin
  select activo into v_activo from public.coberturas where id = new.cobertura_id;
  if not found then
    raise exception 'COBERTURA_INVALIDA';
  end if;
  if not v_activo then
    raise exception 'COBERTURA_INACTIVA';
  end if;
  return new;
end $$;

drop trigger if exists validar_profesional_cobertura on public.profesional_coberturas;
create trigger validar_profesional_cobertura
  before insert on public.profesional_coberturas
  for each row execute function public.validar_profesional_cobertura();

-- Los vínculos no se "mueven": para cambiar una cobertura se borra y se crea.
revoke update on public.profesional_coberturas from anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. RPC: reemplaza la selección de coberturas de un profesional (atómico)
--    Verifica sesión, dueño o admin, y que todas existan y estén activas.
--    Los vínculos con coberturas INACTIVAS se preservan (historial):
--    no se muestran ni se usan en el buscador, pero reaparecen si la
--    cobertura se reactiva.
-- ---------------------------------------------------------------------
create or replace function public.set_profesional_coberturas(p_profesional_id uuid, p_cobertura_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'NO_AUTORIZADO';
  end if;

  select user_id into v_user from public.profesionales where id = p_profesional_id for update;
  if not found then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_user is distinct from auth.uid() and not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  v_ids := array(select distinct x from unnest(coalesce(p_cobertura_ids, '{}'::uuid[])) as x where x is not null);

  if exists (
    select 1 from unnest(v_ids) as x
    where not exists (select 1 from public.coberturas c where c.id = x and c.activo)
  ) then
    raise exception 'COBERTURA_INVALIDA';
  end if;

  delete from public.profesional_coberturas pc
  using public.coberturas c
  where pc.profesional_id = p_profesional_id
    and c.id = pc.cobertura_id
    and c.activo
    and not (pc.cobertura_id = any(v_ids));

  insert into public.profesional_coberturas (profesional_id, cobertura_id)
  select p_profesional_id, x from unnest(v_ids) as x
  on conflict do nothing;
end $$;

revoke execute on function public.set_profesional_coberturas(uuid, uuid[]) from public, anon;
grant execute on function public.set_profesional_coberturas(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Registro: vincula las coberturas elegidas en el alta (metadata.cobertura_ids)
--    Solo acepta coberturas existentes y activas. Nunca bloquea el alta.
--    (Se ejecuta después de on_auth_user_created, que crea el profesional.)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user_coberturas()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_pid uuid;
begin
  if coalesce(meta->>'tipo', '') <> 'profesional' or coalesce(jsonb_typeof(meta->'cobertura_ids'), '') <> 'array' then
    return new;
  end if;

  select id into v_pid from public.profesionales where user_id = new.id;
  if v_pid is null then
    return new;
  end if;

  insert into public.profesional_coberturas (profesional_id, cobertura_id)
  select v_pid, c.id
  from public.coberturas c
  where c.activo
    and c.id::text in (select jsonb_array_elements_text(meta->'cobertura_ids'))
  on conflict do nothing;

  return new;
exception when others then
  return new;
end $$;

drop trigger if exists on_auth_user_created_coberturas on auth.users;
create trigger on_auth_user_created_coberturas
  after insert on auth.users
  for each row execute function public.handle_new_user_coberturas();

-- ---------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------
alter table public.coberturas enable row level security;
alter table public.profesional_coberturas enable row level security;

-- Público y profesionales: solo activas. Admin: todas.
drop policy if exists "coberturas: lectura" on public.coberturas;
create policy "coberturas: lectura" on public.coberturas
  for select using (activo or public.is_admin());

drop policy if exists "coberturas: admin crea" on public.coberturas;
create policy "coberturas: admin crea" on public.coberturas
  for insert with check (public.is_admin());

drop policy if exists "coberturas: admin edita" on public.coberturas;
create policy "coberturas: admin edita" on public.coberturas
  for update using (public.is_admin()) with check (public.is_admin());

-- Sin policy de DELETE: las coberturas no se borran físicamente (se desactivan).
revoke delete on public.coberturas from anon, authenticated;

-- Público: solo vínculos de profesionales activos con coberturas ACTIVAS
-- (los vínculos históricos con coberturas desactivadas no se exponen).
-- El propio profesional ve todos sus vínculos; el admin ve todo.
drop policy if exists "profesional_coberturas: lectura" on public.profesional_coberturas;
create policy "profesional_coberturas: lectura" on public.profesional_coberturas
  for select using (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or (
      exists (select 1 from public.profesionales p where p.id = profesional_id and p.estado = 'activo')
      and exists (select 1 from public.coberturas c where c.id = cobertura_id and c.activo)
    )
    or public.is_admin()
  );

-- Los profesionales escriben SOLO vía set_profesional_coberturas.
drop policy if exists "profesional_coberturas: admin inserta" on public.profesional_coberturas;
create policy "profesional_coberturas: admin inserta" on public.profesional_coberturas
  for insert with check (public.is_admin());

drop policy if exists "profesional_coberturas: admin borra" on public.profesional_coberturas;
create policy "profesional_coberturas: admin borra" on public.profesional_coberturas
  for delete using (public.is_admin());
