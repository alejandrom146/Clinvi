-- =====================================================================
-- ClinVi — Migración 004: Motivos de consulta conservan vínculos inactivos
-- Ejecutar DESPUÉS de motivos_consulta.sql, en Supabase → SQL Editor → Run.
-- Idempotente. No modifica ni borra datos: solo reemplaza 2 funciones y 1 política.
--
-- Qué cambia (mismo comportamiento que coberturas):
--   * set_profesional_motivos ya no borra los vínculos con motivos DESACTIVADOS
--     cuando el profesional guarda su perfil: quedan como historial y
--     reaparecen solos si el motivo se reactiva.
--   * El máximo de 8 cuenta solo motivos ACTIVOS (los inactivos no ocupan lugar).
--   * El público ya no puede leer vínculos con motivos desactivados.
--
-- motivos_consulta.sql ya contiene estas mismas definiciones: si lo re-ejecutás,
-- el resultado es idéntico. Este archivo evita tener que re-ejecutarlo completo.
--
-- Nota: si un motivo se reactiva, un profesional podría quedar con más de 8
-- motivos activos. El perfil lo muestra igual; al volver a guardar, el panel
-- le pide quitar los que sobran. Revisalo con el bloque E de verificar_motivos.sql.
--
-- Ya no se recuperan vínculos que la versión anterior haya borrado.
-- =====================================================================

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

  -- Solo cuentan los motivos ACTIVOS: los vínculos con motivos desactivados se
  -- conservan como historial y no ocupan lugar en el máximo.
  select count(*) into v_count
  from public.profesional_motivos pm
  join public.motivos_consulta m on m.id = pm.motivo_id
  where pm.profesional_id = new.profesional_id and pm.motivo_id <> new.motivo_id and m.activo;
  if v_count >= 8 then
    raise exception 'MOTIVOS_MAXIMO';
  end if;

  return new;
end $$;

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

  -- Solo quita vínculos de motivos ACTIVOS: los de motivos desactivados se preservan
  -- (no se muestran ni se usan en el buscador, y reaparecen si el motivo se reactiva).
  delete from public.profesional_motivos pm
  using public.motivos_consulta m
  where pm.profesional_id = p_profesional_id
    and m.id = pm.motivo_id
    and m.activo
    and not (pm.motivo_id = any(v_ids));

  insert into public.profesional_motivos (profesional_id, motivo_id)
  select p_profesional_id, x from unnest(v_ids) as x
  on conflict do nothing;
end $$;

revoke execute on function public.set_profesional_motivos(uuid, uuid[]) from public, anon;
grant execute on function public.set_profesional_motivos(uuid, uuid[]) to authenticated;

-- Público: solo vínculos de profesionales activos con motivos ACTIVOS
-- (los vínculos históricos con motivos desactivados no se exponen).
-- El propio profesional ve todos sus vínculos; el admin ve todo.
drop policy if exists "profesional_motivos: lectura" on public.profesional_motivos;
create policy "profesional_motivos: lectura" on public.profesional_motivos
  for select using (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or (
      exists (select 1 from public.profesionales p where p.id = profesional_id and p.estado = 'activo')
      and exists (select 1 from public.motivos_consulta m where m.id = motivo_id and m.activo)
    )
    or public.is_admin()
  );
