-- =====================================================================
-- ClinVi — Migración 002: Motivos de consulta (lista maestra + relación)
-- Ejecutar DESPUÉS de schema.sql, en Supabase → SQL Editor → Run.
-- Idempotente: se puede ejecutar varias veces sin duplicar datos.
--
-- Qué cambia:
--   + Tabla motivos_consulta (lista maestra por especialidad).
--   + Tabla profesional_motivos (profesional ↔ motivo, máx. 8).
--   + Triggers de validación, limpieza y recálculo de búsqueda.
--   + Función set_profesional_motivos (único camino de escritura para profesionales).
--   + Migra profesionales.motivos (texto libre) a la relación, cuando coincide.
--   = profesionales.motivos NO se borra: queda como respaldo (legacy).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.motivos_consulta (
  id uuid primary key default gen_random_uuid(),
  especialidad text not null check (char_length(trim(especialidad)) between 2 and 60),
  motivo text not null check (char_length(trim(motivo)) between 2 and 80),
  activo boolean not null default true,
  notas text check (notas is null or char_length(notas) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidad por (especialidad + motivo), sin distinguir mayúsculas ni acentos.
-- "Trastornos alimentarios" puede existir en Psicología y en Nutrición.
create unique index if not exists motivos_consulta_especialidad_motivo_uidx
  on public.motivos_consulta (especialidad, public.normalizar(motivo));
create index if not exists motivos_consulta_especialidad_activo_idx
  on public.motivos_consulta (especialidad, activo);

create table if not exists public.profesional_motivos (
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  motivo_id uuid not null references public.motivos_consulta(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profesional_id, motivo_id)
);
create index if not exists profesional_motivos_motivo_idx on public.profesional_motivos (motivo_id);

-- ---------------------------------------------------------------------
-- 2. Triggers de motivos_consulta
-- ---------------------------------------------------------------------
create or replace function public.motivos_consulta_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.motivo := trim(regexp_replace(new.motivo, '\s+', ' ', 'g'));
  new.especialidad := trim(new.especialidad);
  new.notas := nullif(trim(coalesce(new.notas, '')), '');
  if tg_op = 'UPDATE' and new.especialidad is distinct from old.especialidad
     and exists (select 1 from public.profesional_motivos where motivo_id = old.id) then
    raise exception 'MOTIVO_ESPECIALIDAD_FIJA';
  end if;
  return new;
end $$;

drop trigger if exists a_guard_motivos on public.motivos_consulta;
create trigger a_guard_motivos
  before insert or update on public.motivos_consulta
  for each row execute function public.motivos_consulta_guard();

drop trigger if exists updated_at_motivos on public.motivos_consulta;
create trigger updated_at_motivos
  before update on public.motivos_consulta
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Validación de profesional_motivos (misma especialidad, activo, máx. 8)
-- ---------------------------------------------------------------------
create or replace function public.validar_profesional_motivo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_esp text;
  v_m_esp text;
  v_m_activo boolean;
  v_count int;
begin
  -- Bloquea la fila del profesional para evitar carreras al contar.
  select especialidad into v_esp from public.profesionales where id = new.profesional_id for update;
  if not found then
    raise exception 'NO_AUTORIZADO';
  end if;

  select especialidad, activo into v_m_esp, v_m_activo from public.motivos_consulta where id = new.motivo_id;
  if not found then
    raise exception 'MOTIVO_INVALIDO';
  end if;
  if v_m_esp <> v_esp then
    raise exception 'MOTIVO_OTRA_ESPECIALIDAD';
  end if;
  if not v_m_activo then
    raise exception 'MOTIVO_INACTIVO';
  end if;

  select count(*) into v_count from public.profesional_motivos
  where profesional_id = new.profesional_id and motivo_id <> new.motivo_id;
  if v_count >= 8 then
    raise exception 'MOTIVOS_MAXIMO';
  end if;

  return new;
end $$;

drop trigger if exists validar_profesional_motivo on public.profesional_motivos;
create trigger validar_profesional_motivo
  before insert or update on public.profesional_motivos
  for each row execute function public.validar_profesional_motivo();

-- ---------------------------------------------------------------------
-- 4. Cambio de especialidad: elimina vínculos incompatibles
-- ---------------------------------------------------------------------
create or replace function public.limpiar_motivos_incompatibles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.profesional_motivos pm
  using public.motivos_consulta m
  where pm.profesional_id = new.id
    and m.id = pm.motivo_id
    and m.especialidad <> new.especialidad;
  return null;
end $$;

drop trigger if exists d_limpiar_motivos on public.profesionales;
create trigger d_limpiar_motivos
  after update of especialidad on public.profesionales
  for each row when (old.especialidad is distinct from new.especialidad)
  execute function public.limpiar_motivos_incompatibles();

-- ---------------------------------------------------------------------
-- 5. Texto de búsqueda: usa los motivos ACTIVOS de la relación
--    (se ejecuta después de b_search_text_profesional y lo reemplaza)
-- ---------------------------------------------------------------------
create or replace function public.profesionales_search_text_motivos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.search_text := public.normalizar(concat_ws(' ',
    new.nombre, new.especialidad, new.subtitulo, new.bio, new.provincia,
    array_to_string(new.habilidades, ' '),
    (select string_agg(m.motivo, ' ')
       from public.profesional_motivos pm
       join public.motivos_consulta m on m.id = pm.motivo_id
      where pm.profesional_id = new.id and m.activo)));
  return new;
end $$;

drop trigger if exists b_search_text_zmotivos on public.profesionales;
create trigger b_search_text_zmotivos
  before insert or update on public.profesionales
  for each row execute function public.profesionales_search_text_motivos();

create or replace function public.refrescar_busqueda_por_vinculo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if tg_op = 'DELETE' then
    pid := old.profesional_id;
  else
    pid := new.profesional_id;
  end if;
  update public.profesionales set search_text = search_text where id = pid;
  return null;
end $$;

drop trigger if exists refrescar_busqueda on public.profesional_motivos;
create trigger refrescar_busqueda
  after insert or delete on public.profesional_motivos
  for each row execute function public.refrescar_busqueda_por_vinculo();

create or replace function public.refrescar_busqueda_por_motivo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profesionales p set search_text = search_text
  where exists (select 1 from public.profesional_motivos pm where pm.profesional_id = p.id and pm.motivo_id = new.id);
  return null;
end $$;

drop trigger if exists refrescar_busqueda_motivo on public.motivos_consulta;
create trigger refrescar_busqueda_motivo
  after update of motivo, activo on public.motivos_consulta
  for each row when (old.motivo is distinct from new.motivo or old.activo is distinct from new.activo)
  execute function public.refrescar_busqueda_por_motivo();

-- ---------------------------------------------------------------------
-- 6. RPC: reemplaza la selección de motivos de un profesional (atómico)
--    Verifica: sesión, dueño o admin, 1..8, misma especialidad, activos.
-- ---------------------------------------------------------------------
create or replace function public.set_profesional_motivos(p_profesional_id uuid, p_motivo_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_esp text;
  v_ids uuid[];
  v_disponibles int;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTORIZADO';
  end if;

  select user_id, especialidad into v_user, v_esp
  from public.profesionales where id = p_profesional_id for update;
  if not found then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_user is distinct from auth.uid() and not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  v_ids := array(select distinct x from unnest(coalesce(p_motivo_ids, '{}'::uuid[])) as x where x is not null);

  if cardinality(v_ids) > 8 then
    raise exception 'MOTIVOS_MAXIMO';
  end if;

  select count(*) into v_disponibles from public.motivos_consulta where especialidad = v_esp and activo;
  if v_disponibles > 0 and cardinality(v_ids) < 1 then
    raise exception 'MOTIVOS_MINIMO';
  end if;

  if exists (
    select 1 from unnest(v_ids) as x
    where not exists (select 1 from public.motivos_consulta m where m.id = x and m.especialidad = v_esp and m.activo)
  ) then
    raise exception 'MOTIVO_INVALIDO';
  end if;

  delete from public.profesional_motivos
  where profesional_id = p_profesional_id and not (motivo_id = any(v_ids));

  insert into public.profesional_motivos (profesional_id, motivo_id)
  select p_profesional_id, x from unnest(v_ids) as x
  on conflict do nothing;
end $$;

revoke execute on function public.set_profesional_motivos(uuid, uuid[]) from public, anon;
grant execute on function public.set_profesional_motivos(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Registro: vincula los motivos elegidos (metadata.motivo_ids)
--    Solo acepta motivos activos de la especialidad elegida, máx. 8.
--    Nunca bloquea el alta del usuario.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user_motivos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_pid uuid;
  v_esp text;
begin
  if coalesce(meta->>'tipo', '') <> 'profesional' or coalesce(jsonb_typeof(meta->'motivo_ids'), '') <> 'array' then
    return new;
  end if;

  select id, especialidad into v_pid, v_esp from public.profesionales where user_id = new.id;
  if v_pid is null then
    return new;
  end if;

  insert into public.profesional_motivos (profesional_id, motivo_id)
  select v_pid, m.id
  from public.motivos_consulta m
  where m.activo
    and m.especialidad = v_esp
    and m.id::text in (select jsonb_array_elements_text(meta->'motivo_ids'))
  order by m.motivo
  limit 8
  on conflict do nothing;

  return new;
exception when others then
  return new;
end $$;

drop trigger if exists on_auth_user_created_motivos on auth.users;
create trigger on_auth_user_created_motivos
  after insert on auth.users
  for each row execute function public.handle_new_user_motivos();

-- ---------------------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------------------
alter table public.motivos_consulta enable row level security;
alter table public.profesional_motivos enable row level security;

drop policy if exists "motivos: lectura" on public.motivos_consulta;
create policy "motivos: lectura" on public.motivos_consulta
  for select using (activo or public.is_admin());

drop policy if exists "motivos: admin crea" on public.motivos_consulta;
create policy "motivos: admin crea" on public.motivos_consulta
  for insert with check (public.is_admin());

drop policy if exists "motivos: admin edita" on public.motivos_consulta;
create policy "motivos: admin edita" on public.motivos_consulta
  for update using (public.is_admin()) with check (public.is_admin());

-- Sin policy de DELETE: los motivos no se borran físicamente (se desactivan).
revoke delete on public.motivos_consulta from anon, authenticated;

drop policy if exists "profesional_motivos: lectura" on public.profesional_motivos;
create policy "profesional_motivos: lectura" on public.profesional_motivos
  for select using (
    exists (select 1 from public.profesionales p where p.id = profesional_id
            and (p.estado = 'activo' or p.user_id = auth.uid()))
    or public.is_admin()
  );

-- Los profesionales escriben SOLO vía set_profesional_motivos.
drop policy if exists "profesional_motivos: admin inserta" on public.profesional_motivos;
create policy "profesional_motivos: admin inserta" on public.profesional_motivos
  for insert with check (public.is_admin());

drop policy if exists "profesional_motivos: admin borra" on public.profesional_motivos;
create policy "profesional_motivos: admin borra" on public.profesional_motivos
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- 9. Datos iniciales (no duplica ni pisa cambios del admin al re-ejecutar)
-- ---------------------------------------------------------------------
insert into public.motivos_consulta (especialidad, motivo)
select v.especialidad, v.motivo
from (values
  ('Psicología', 'Ansiedad'),
  ('Psicología', 'Depresión'),
  ('Psicología', 'Duelo'),
  ('Psicología', 'Terapia de pareja'),
  ('Psicología', 'Autoestima'),
  ('Psicología', 'Estrés laboral'),
  ('Psicología', 'Ataques de pánico'),
  ('Psicología', 'Trastornos del sueño'),
  ('Psicología', 'Adicciones'),
  ('Psicología', 'Terapia familiar'),
  ('Psicología', 'Adolescentes'),
  ('Psicología', 'Trauma'),
  ('Psicología', 'Trastornos alimentarios'),
  ('Psiquiatría', 'Diagnóstico y evaluación'),
  ('Psiquiatría', 'Ajuste de medicación'),
  ('Psiquiatría', 'Trastornos del ánimo'),
  ('Psiquiatría', 'Trastornos de ansiedad'),
  ('Psiquiatría', 'TDAH adulto'),
  ('Psiquiatría', 'TDAH infantil'),
  ('Psiquiatría', 'Trastorno bipolar'),
  ('Psiquiatría', 'Insomnio'),
  ('Psiquiatría', 'Seguimiento post internación'),
  ('Psiquiatría', 'Interconsulta con psicología'),
  ('Fonoaudiología', 'Retraso del habla'),
  ('Fonoaudiología', 'Trastornos del lenguaje infantil'),
  ('Fonoaudiología', 'Tartamudez'),
  ('Fonoaudiología', 'Terapia de voz'),
  ('Fonoaudiología', 'Rehabilitación post ACV'),
  ('Fonoaudiología', 'Dificultades de deglución'),
  ('Fonoaudiología', 'Pérdida auditiva'),
  ('Fonoaudiología', 'Dislexia y lectoescritura'),
  ('Fonoaudiología', 'Estimulación temprana'),
  ('Kinesiología', 'Rehabilitación post cirugía'),
  ('Kinesiología', 'Dolor lumbar'),
  ('Kinesiología', 'Lesiones deportivas'),
  ('Kinesiología', 'Kinesiología respiratoria'),
  ('Kinesiología', 'Rehabilitación neurológica'),
  ('Kinesiología', 'Postura y columna'),
  ('Kinesiología', 'Kinesiología pre y post parto'),
  ('Kinesiología', 'Movilidad en adultos mayores'),
  ('Kinesiología', 'Dolor articular crónico'),
  ('Medicina clínica', 'Control anual / chequeo general'),
  ('Medicina clínica', 'Certificados médicos'),
  ('Medicina clínica', 'Seguimiento de hipertensión o diabetes'),
  ('Medicina clínica', 'Consulta por síntomas agudos'),
  ('Medicina clínica', 'Orden de estudios y análisis'),
  ('Medicina clínica', 'Segunda opinión médica'),
  ('Medicina clínica', 'Vacunación y prevención'),
  ('Medicina clínica', 'Medicina laboral'),
  ('Nutrición', 'Bajar de peso'),
  ('Nutrición', 'Aumentar masa muscular'),
  ('Nutrición', 'Nutrición deportiva'),
  ('Nutrición', 'Trastornos alimentarios'),
  ('Nutrición', 'Nutrición clínica (diabetes, colesterol)'),
  ('Nutrición', 'Nutrición infantil'),
  ('Nutrición', 'Embarazo y lactancia'),
  ('Nutrición', 'Intolerancias y alergias alimentarias'),
  ('Nutrición', 'Alimentación vegetariana/vegana')
) as v(especialidad, motivo)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 10. Migración de datos existentes (profesionales.motivos → relación)
--     Solo coincidencias exactas (sin distinguir mayúsculas/acentos) dentro
--     de la MISMA especialidad. Solo profesionales que aún no tienen vínculos.
--     Máximo 8 por profesional. Lo que no coincide queda en la columna vieja
--     y se lista con supabase/verificar_motivos.sql.
-- ---------------------------------------------------------------------
insert into public.profesional_motivos (profesional_id, motivo_id)
select x.profesional_id, x.motivo_id
from (
  select d.profesional_id, d.motivo_id,
         row_number() over (partition by d.profesional_id order by d.ord) as rn
  from (
    select distinct on (p.id, m.id) p.id as profesional_id, m.id as motivo_id, u.ord
    from public.profesionales p
    cross join lateral unnest(p.motivos) with ordinality as u(txt, ord)
    join public.motivos_consulta m
      on m.especialidad = p.especialidad
     and m.activo
     and public.normalizar(m.motivo) = public.normalizar(trim(u.txt))
    where not exists (select 1 from public.profesional_motivos pm where pm.profesional_id = p.id)
    order by p.id, m.id, u.ord
  ) d
) x
where x.rn <= 8
on conflict do nothing;

-- Recalcula el texto de búsqueda de todos los profesionales.
update public.profesionales set search_text = search_text;
