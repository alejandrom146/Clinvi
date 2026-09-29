-- =====================================================================
-- ClinVi — Verificación de la migración de motivos de consulta
-- Ejecutá cada bloque por separado (seleccionalo y "Run selected").
-- =====================================================================

-- A) Motivos cargados por especialidad (esperado: Psicología 13, Psiquiatría 10,
--    Fonoaudiología 9, Kinesiología 9, Medicina clínica 8, Nutrición 9 → 58)
select especialidad, count(*) as total, count(*) filter (where activo) as activos
from public.motivos_consulta
group by especialidad
order by especialidad;

-- B) Textos viejos (profesionales.motivos) que NO pudieron mapearse automáticamente.
--    Revisalos y asignalos a mano desde el panel del profesional o de administración.
select p.nombre, p.especialidad, trim(u.txt) as motivo_viejo
from public.profesionales p
cross join lateral unnest(p.motivos) as u(txt)
where not exists (
  select 1 from public.motivos_consulta m
  where m.especialidad = p.especialidad
    and public.normalizar(m.motivo) = public.normalizar(trim(u.txt))
)
order by p.nombre;

-- C) Profesionales sin motivos ACTIVOS en especialidades que sí tienen motivos.
select p.nombre, p.especialidad, p.estado
from public.profesionales p
where exists (select 1 from public.motivos_consulta m where m.especialidad = p.especialidad and m.activo)
  and not exists (
    select 1 from public.profesional_motivos pm
    join public.motivos_consulta m on m.id = pm.motivo_id
    where pm.profesional_id = p.id and m.activo)
order by p.nombre;

-- D) Inconsistencias de especialidad (esperado: 0 filas).
select p.nombre, p.especialidad, m.especialidad as especialidad_motivo, m.motivo
from public.profesional_motivos pm
join public.profesionales p on p.id = pm.profesional_id
join public.motivos_consulta m on m.id = pm.motivo_id
where m.especialidad <> p.especialidad;

-- E) Profesionales con más de 8 motivos ACTIVOS (esperado: 0 filas).
--    Los vínculos con motivos desactivados se conservan y no cuentan.
--    Puede aparecer alguno tras REACTIVAR un motivo: el profesional deberá quitar los sobrantes.
select p.nombre, count(*) as motivos_activos
from public.profesional_motivos pm
join public.motivos_consulta m on m.id = pm.motivo_id and m.activo
join public.profesionales p on p.id = pm.profesional_id
group by p.nombre having count(*) > 8;

-- G) Vínculos conservados con motivos desactivados (informativo).
select m.especialidad, m.motivo, count(*) as profesionales
from public.profesional_motivos pm
join public.motivos_consulta m on m.id = pm.motivo_id and not m.activo
group by 1, 2 order by 1, 2;

-- F) Duplicados especialidad + motivo (esperado: 0 filas).
select especialidad, public.normalizar(motivo), count(*)
from public.motivos_consulta
group by 1, 2 having count(*) > 1;

-- H) Vínculos con motivos desactivados: se conservan (ejecutar este bloque completo).
--    Crea datos de prueba y los REVIERTE al terminar. Resultado: todas las filas en OK.
--    Si tu proyecto no permite escribir en auth.users desde el SQL Editor, verás una fila ERROR.
drop table if exists _verificacion_motivos;
create temp table _verificacion_motivos (orden int, verificacion text, estado text, detalle text);

do $verif$
declare
  u_pro uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  pid uuid;
  m uuid[];
  v_n int;
  res text[] := '{}';
begin
  begin -- bloque que se revierte
    insert into auth.users (id, email, raw_user_meta_data) values
      (u_pro, 'verif-mot-pro@clinvi.test', jsonb_build_object('tipo', 'profesional', 'nombre', 'Verif Motivos', 'especialidad', 'Psicología')),
      (u_admin, 'verif-mot-admin@clinvi.test', '{}'::jsonb);
    update public.profiles set rol = 'admin' where id = u_admin;
    select id into pid from public.profesionales where user_id = u_pro;
    update public.profesionales set estado = 'activo' where id = pid;
    m := array(select id from public.motivos_consulta where especialidad = 'Psicología' and activo order by motivo limit 9);
    if pid is null or cardinality(m) < 9 then
      raise exception 'PRECONDICION: hacen falta 9 motivos activos de Psicología (motivos_consulta.sql)';
    end if;

    -- El profesional elige 8 motivos (m1..m8).
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.set_profesional_motivos(pid, m[1:8]);

    -- El admin desactiva m8.
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.motivos_consulta set activo = false where id = m[8];

    -- H1: el público no ve el vínculo con el motivo desactivado (y sí los activos).
    reset role;
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    select count(*) into v_n from public.profesional_motivos where profesional_id = pid;
    res := res || format('1|El público ve solo los vínculos con motivos activos|%s|%s de 7 visibles', case when v_n = 7 then 'OK' else 'FALLA' end, v_n);

    -- H2: al guardar 7 activos + uno nuevo (8 activos), el inactivo NO cuenta para el máximo.
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      perform public.set_profesional_motivos(pid, m[1:7] || m[9]);
      res := res || text '2|Un motivo inactivo conservado no ocupa lugar en el máximo de 8|OK|guardado aceptado';
    exception when others then
      res := res || format('2|Un motivo inactivo conservado no ocupa lugar en el máximo de 8|FALLA|%s', sqlerrm);
    end;

    -- H3: el vínculo con el motivo desactivado se conservó al guardar.
    reset role;
    select count(*) into v_n from public.profesional_motivos where profesional_id = pid and motivo_id = m[8];
    res := res || format('3|Guardar el perfil conserva el vínculo con el motivo desactivado|%s|%s vínculo(s)', case when v_n = 1 then 'OK' else 'FALLA' end, v_n);

    -- H4: no se puede elegir el motivo desactivado.
    set local role authenticated;
    begin
      perform public.set_profesional_motivos(pid, m[1:6] || m[8]);
      res := res || text '4|No se puede elegir un motivo desactivado|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('4|No se puede elegir un motivo desactivado|%s|%s', case when sqlerrm like '%MOTIVO_INVALIDO%' then 'OK' else 'FALLA' end, sqlerrm);
    end;

    -- H5: al reactivarlo, el vínculo reaparece solo (queda con 9 activos) ...
    reset role;
    update public.motivos_consulta set activo = true where id = m[8];
    set local role authenticated;
    select count(*) into v_n from public.profesional_motivos pm join public.motivos_consulta mc on mc.id = pm.motivo_id and mc.activo
    where pm.profesional_id = pid;
    res := res || format('5|Al reactivar el motivo, el vínculo vuelve a estar activo|%s|%s motivos activos', case when v_n = 9 then 'OK' else 'FALLA' end, v_n);

    -- H6: ... y el máximo se sigue exigiendo al guardar (debe quitar uno).
    begin
      perform public.set_profesional_motivos(pid, m[1:9]);
      res := res || text '6|Con 9 activos, guardar los 9 sigue rechazado por el máximo|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('6|Con 9 activos, guardar los 9 sigue rechazado por el máximo|%s|%s', case when sqlerrm like '%MOTIVOS_MAXIMO%' then 'OK' else 'FALLA' end, sqlerrm);
    end;
    begin
      perform public.set_profesional_motivos(pid, m[1:8]);
      res := res || text '7|Quitando uno, guarda correctamente|OK|guardado aceptado';
    exception when others then
      res := res || format('7|Quitando uno, guarda correctamente|FALLA|%s', sqlerrm);
    end;

    raise exception 'ROLLBACK_VERIFICACION';
  exception when others then
    reset role;
    if sqlerrm <> 'ROLLBACK_VERIFICACION' then
      res := res || format('99|La verificación se interrumpió|ERROR|%s', sqlerrm);
    end if;
  end;

  insert into _verificacion_motivos
  select split_part(x, '|', 1)::int, split_part(x, '|', 2), split_part(x, '|', 3), split_part(x, '|', 4) from unnest(res) as x;
end $verif$;

select * from _verificacion_motivos order by orden;
