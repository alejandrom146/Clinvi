-- =====================================================================
-- ClinVi — Verificación de coberturas (datos + seguridad)
-- Ejecutar en Supabase → SQL Editor → Run, DESPUÉS de coberturas.sql
-- y coberturas_import.sql.
--
-- NO deja cambios: todas las pruebas de permisos se ejecutan dentro de un
-- bloque que se revierte por completo al terminar (usuarios, profesionales
-- y vínculos de prueba incluidos).
--
-- El resultado es una tabla con una fila por verificación: estado OK / FALLA.
-- Cualquier FALLA indica un problema que hay que revisar antes del deploy.
-- =====================================================================

drop table if exists _verificacion_coberturas;
create temp table _verificacion_coberturas (orden numeric, caso text, verificacion text, estado text, detalle text);
grant all on _verificacion_coberturas to anon, authenticated;

-- ---------------------------------------------------------------------
-- A. Datos importados (solo lectura)
-- ---------------------------------------------------------------------
insert into _verificacion_coberturas
select 1, 'Caso 1', 'Cantidad total de coberturas del CSV (78)',
       case when count(*) filter (where origen = 'csv_inicial') = 78 then 'OK' else 'FALLA' end,
       count(*) filter (where origen = 'csv_inicial') || ' con origen csv_inicial, ' || count(*) || ' en total'
from public.coberturas;

insert into _verificacion_coberturas
select 2, 'Caso 1', 'Cantidades por tipo (33 / 24 / 20 / 1)',
       case when string_agg(tipo || '=' || n, ', ' order by tipo) =
                 'obra_social_nacional=33, obra_social_provincial=24, otra=1, prepaga=20' then 'OK' else 'FALLA' end,
       string_agg(tipo || '=' || n, ', ' order by tipo)
from (select tipo, count(*) n from public.coberturas where origen = 'csv_inicial' group by tipo) t;

insert into _verificacion_coberturas
select 3, 'Caso 2', 'Sin duplicados por identidad (nombre + provincia)',
       case when count(*) = 0 then 'OK' else 'FALLA' end, count(*) || ' grupos duplicados'
from (select 1 from public.coberturas group by public.normalizar(nombre), coalesce(provincia, '') having count(*) > 1) d;

insert into _verificacion_coberturas
select 4, 'Caso 11', 'Siglas compartidas entre provincias se conservan como coberturas distintas',
       case when count(*) filter (where sigla = 'OSEP') = 2 and count(*) filter (where sigla = 'IPS') = 2
             and count(distinct id) filter (where sigla in ('OSEP', 'IPS')) = 4 then 'OK' else 'FALLA' end,
       string_agg(sigla || ' (' || provincia || ')', ', ' order by sigla, provincia) filter (where sigla in ('OSEP', 'IPS'))
from public.coberturas;

insert into _verificacion_coberturas
select 5, 'Caso 1', 'Estados importados: IOSFA inactiva, el resto activas',
       case when count(*) filter (where not activo) = 1
             and bool_and(activo) filter (where sigla is distinct from 'IOSFA') then 'OK' else 'FALLA' end,
       'inactivas: ' || coalesce(string_agg(coalesce(sigla, nombre), ', ') filter (where not activo), 'ninguna')
from public.coberturas where origen = 'csv_inicial';

insert into _verificacion_coberturas
select 6, 'Caso 1', 'Campos vacíos guardados como NULL (no texto vacío)',
       case when count(*) = 0 then 'OK' else 'FALLA' end, count(*) || ' registros con texto vacío'
from public.coberturas where sigla = '' or provincia = '' or notas = '';

insert into _verificacion_coberturas
select 7, 'Integridad', 'Vínculos con coberturas inactivas (se conservan, no se muestran)',
       'INFO', count(*) || ' vínculo(s)'
from public.profesional_coberturas pc join public.coberturas c on c.id = pc.cobertura_id where not c.activo;

-- ---------------------------------------------------------------------
-- B. Seguridad y comportamiento (se revierte todo al final)
-- ---------------------------------------------------------------------
do $verif$
declare
  u_pro1 uuid := gen_random_uuid();
  u_pro2 uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  p1 uuid; p2 uuid;
  c_osde uuid; c_iosfa uuid; c_osep_cat uuid; c_osep_mza uuid; c_particular uuid;
  v_n int;
  v_txt text;
  res text[] := '{}';
begin
  begin -- bloque que se revierte
    -- Usuarios de prueba (los triggers de registro crean profiles + profesionales).
    insert into auth.users (id, email, raw_user_meta_data) values
      (u_pro1, 'verif-pro1@clinvi.test', jsonb_build_object('tipo', 'profesional', 'nombre', 'Verif Uno', 'especialidad', 'Psicología')),
      (u_pro2, 'verif-pro2@clinvi.test', jsonb_build_object('tipo', 'profesional', 'nombre', 'Verif Dos', 'especialidad', 'Psicología')),
      (u_admin, 'verif-admin@clinvi.test', '{}'::jsonb);
    update public.profiles set rol = 'admin' where id = u_admin;
    select id into p1 from public.profesionales where user_id = u_pro1;
    select id into p2 from public.profesionales where user_id = u_pro2;
    -- Se aprueban para que sus datos sean públicos (como un profesional verificado).
    update public.profesionales set estado = 'activo' where id in (p1, p2);

    select id into c_osde from public.coberturas where sigla = 'OSDE' and provincia is null;
    select id into c_iosfa from public.coberturas where sigla = 'IOSFA';
    select id into c_osep_cat from public.coberturas where sigla = 'OSEP' and provincia = 'Catamarca';
    select id into c_osep_mza from public.coberturas where sigla = 'OSEP' and provincia = 'Mendoza';
    select id into c_particular from public.coberturas where tipo = 'otra' and nombre ilike 'Particular%';

    if p1 is null or p2 is null or c_osde is null or c_iosfa is null or c_osep_cat is null or c_osep_mza is null then
      raise exception 'PRECONDICION: faltan datos base (¿se ejecutaron coberturas.sql y coberturas_import.sql?)';
    end if;

    -- ---------- Como profesional 1 ----------
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro1, 'role', 'authenticated')::text, true);
    set local role authenticated;

    -- Caso 5: guarda varias coberturas y las recupera.
    perform public.set_profesional_coberturas(p1, array[c_osde, c_osep_cat, c_particular]);
    select count(*) into v_n from public.profesional_coberturas where profesional_id = p1;
    res := res || format('10|Caso 5|Un profesional guarda varias coberturas y las recupera|%s|%s vínculos leídos', case when v_n = 3 then 'OK' else 'FALLA' end, v_n);

    -- Caso 6: no puede modificar las de otro profesional (RPC).
    begin
      perform public.set_profesional_coberturas(p2, array[c_osde]);
      res := res || text '11|Caso 6|No puede modificar coberturas de otro profesional (RPC)|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('11|Caso 6|No puede modificar coberturas de otro profesional (RPC)|%s|%s', case when sqlerrm like '%NO_AUTORIZADO%' then 'OK' else 'FALLA' end, sqlerrm);
    end;

    -- Caso 6: tampoco insertando directo en la tabla.
    begin
      insert into public.profesional_coberturas (profesional_id, cobertura_id) values (p2, c_osde);
      res := res || text '12|Caso 6|No puede insertar vínculos directo en la tabla|FALLA|la inserción fue aceptada';
    exception when others then
      res := res || format('12|Caso 6|No puede insertar vínculos directo en la tabla|OK|%s', sqlerrm);
    end;

    -- Caso 6: ni borrar los de otro (RLS filtra: 0 filas afectadas).
    delete from public.profesional_coberturas where profesional_id = p1;
    get diagnostics v_n = row_count;
    res := res || format('13|Caso 6|Un profesional no puede borrar vínculos directo en la tabla|%s|%s filas borradas', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    -- Caso 8: cobertura inactiva por petición manipulada.
    begin
      perform public.set_profesional_coberturas(p1, array[c_iosfa]);
      res := res || text '14|Caso 8|No puede asociar una cobertura inactiva|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('14|Caso 8|No puede asociar una cobertura inactiva|%s|%s', case when sqlerrm like '%COBERTURA_INVALIDA%' then 'OK' else 'FALLA' end, sqlerrm);
    end;

    -- Caso 8: cobertura inexistente.
    begin
      perform public.set_profesional_coberturas(p1, array[gen_random_uuid()]);
      res := res || text '15|Caso 8|No puede asociar una cobertura inexistente|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('15|Caso 8|No puede asociar una cobertura inexistente|%s|%s', case when sqlerrm like '%COBERTURA_INVALIDA%' then 'OK' else 'FALLA' end, sqlerrm);
    end;

    -- Caso 7: un profesional no puede crear, editar ni desactivar coberturas.
    begin
      insert into public.coberturas (tipo, nombre) values ('prepaga', 'Prepaga Falsa');
      res := res || text '16|Caso 7|Profesional no puede crear coberturas|FALLA|la inserción fue aceptada';
    exception when others then
      res := res || format('16|Caso 7|Profesional no puede crear coberturas|OK|%s', sqlerrm);
    end;
    update public.coberturas set activo = false, notas = 'hackeado' where id = c_osde;
    get diagnostics v_n = row_count;
    res := res || format('17|Caso 7|Profesional no puede editar ni desactivar coberturas|%s|%s filas modificadas', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);
    begin
      delete from public.coberturas where id = c_osde;
      get diagnostics v_n = row_count;
      res := res || format('18|Caso 7|Nadie borra coberturas físicamente|%s|%s filas borradas', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);
    exception when others then
      res := res || format('18|Caso 7|Nadie borra coberturas físicamente|OK|%s', sqlerrm);
    end;

    -- ---------- Como visitante anónimo ----------
    reset role;
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;

    select count(*) into v_n from public.profesional_coberturas where profesional_id = p1;
    res := res || format('18.5|Seguridad|El público ve los vínculos activos de un profesional activo (control)|%s|%s vínculos visibles', case when v_n = 3 then 'OK' else 'FALLA' end, v_n);
    select count(*) into v_n from public.coberturas where not activo;
    res := res || format('19|Seguridad|Público no ve coberturas inactivas|%s|%s inactivas visibles', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);
    begin
      perform public.set_profesional_coberturas(p1, array[c_osde]);
      res := res || text '20|Seguridad|Anónimo no puede usar la RPC de coberturas|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('20|Seguridad|Anónimo no puede usar la RPC de coberturas|OK|%s', sqlerrm);
    end;
    update public.coberturas set activo = false where id = c_osde;
    get diagnostics v_n = row_count;
    res := res || format('21|Caso 7|Anónimo no puede editar coberturas|%s|%s filas modificadas', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    -- ---------- Como admin ----------
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
    set local role authenticated;

    -- Admin gestiona coberturas de otro profesional.
    perform public.set_profesional_coberturas(p2, array[c_osep_mza]);
    select count(*) into v_n from public.profesional_coberturas where profesional_id = p2;
    res := res || format('22|Admin|Admin puede asignar coberturas a un profesional|%s|%s vínculos', case when v_n = 1 then 'OK' else 'FALLA' end, v_n);

    -- Caso 11: OSEP Catamarca y OSEP Mendoza no se confunden.
    select count(*) into v_n from public.profesional_coberturas where cobertura_id = c_osep_cat and profesional_id = p2;
    res := res || format('23|Caso 11|Filtrar por OSEP Catamarca no trae a quien solo acepta OSEP Mendoza|%s|%s coincidencias', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    -- Admin no puede crear un duplicado accidental (mayúsculas/acentos distintos).
    begin
      insert into public.coberturas (tipo, nombre, sigla) values ('prepaga', '  osde ', 'OSDE');
      res := res || text '24|Duplicados|Admin no puede crear un duplicado accidental|FALLA|la inserción fue aceptada';
    exception when unique_violation then
      res := res || text '24|Duplicados|Admin no puede crear un duplicado accidental|OK|unique_violation';
    end;

    -- Caso 3: desactivar → desaparece para el público y para nuevas selecciones.
    update public.coberturas set activo = false where id = c_osep_cat;
    get diagnostics v_n = row_count;
    res := res || format('25|Caso 3|Admin puede desactivar una cobertura|%s|%s filas', case when v_n = 1 then 'OK' else 'FALLA' end, v_n);

    reset role;
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    select count(*) into v_n from public.coberturas where id = c_osep_cat;
    res := res || format('26|Caso 3|La cobertura desactivada deja de ser visible para el público|%s|%s filas visibles', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);
    -- El vínculo histórico (profesional 1 ↔ OSEP Catamarca) no se expone al público.
    select count(*) into v_n from public.profesional_coberturas where cobertura_id = c_osep_cat;
    res := res || format('26.5|Caso 3|El público no ve vínculos con coberturas desactivadas|%s|%s vínculos visibles', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      perform public.set_profesional_coberturas(p1, array[c_osde, c_osep_cat]);
      res := res || text '27|Caso 3|No se puede volver a elegir una cobertura desactivada|FALLA|la llamada fue aceptada';
    exception when others then
      res := res || format('27|Caso 3|No se puede volver a elegir una cobertura desactivada|OK|%s', sqlerrm);
    end;

    -- Caso 12: el vínculo histórico se conserva al desactivar y al volver a guardar.
    perform public.set_profesional_coberturas(p1, array[c_osde]);
    reset role;
    select count(*) into v_n from public.profesional_coberturas where profesional_id = p1 and cobertura_id = c_osep_cat;
    res := res || format('28|Caso 12|Desactivar no borra vínculos existentes (ni al volver a guardar)|%s|%s vínculo(s) conservado(s)', case when v_n = 1 then 'OK' else 'FALLA' end, v_n);
    select count(*) into v_n from public.coberturas where id = c_osep_cat;
    res := res || format('29|Caso 12|Desactivar no borra la cobertura|%s|%s fila(s)', case when v_n = 1 then 'OK' else 'FALLA' end, v_n);

    -- Caso 4: reactivar → vuelve a ser seleccionable sin tocar código.
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.coberturas set activo = true where id = c_osep_cat;
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      perform public.set_profesional_coberturas(p1, array[c_osde, c_osep_cat, c_particular]);
      res := res || text '30|Caso 4|Reactivada, se puede volver a seleccionar|OK|guardado aceptado';
    exception when others then
      res := res || format('30|Caso 4|Reactivada, se puede volver a seleccionar|FALLA|%s', sqlerrm);
    end;

    -- Registro: las coberturas elegidas en el alta se vinculan (y se ignoran las inactivas).
    reset role;
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    insert into auth.users (id, email, raw_user_meta_data) values
      (gen_random_uuid(), 'verif-alta@clinvi.test', jsonb_build_object(
         'tipo', 'profesional', 'nombre', 'Verif Alta', 'especialidad', 'Psicología',
         'cobertura_ids', jsonb_build_array(c_osde::text, c_iosfa::text, gen_random_uuid()::text)));
    select count(*), string_agg(c.sigla, ',') into v_n, v_txt
    from public.profesional_coberturas pc
    join public.profesionales p on p.id = pc.profesional_id
    join public.coberturas c on c.id = pc.cobertura_id
    where p.nombre = 'Verif Alta';
    res := res || format('31|Registro|El alta vincula solo coberturas activas y existentes|%s|%s', case when v_n = 1 and v_txt = 'OSDE' then 'OK' else 'FALLA' end, coalesce(v_txt, 'ninguna'));

    raise exception 'ROLLBACK_VERIFICACION';
  exception when others then
    reset role;
    if sqlerrm <> 'ROLLBACK_VERIFICACION' then
      res := res || format('99|ERROR|La verificación se interrumpió|FALLA|%s', sqlerrm);
    end if;
  end;

  -- Fuera del bloque revertido: se guardan los resultados.
  insert into _verificacion_coberturas
  select split_part(x, '|', 1)::numeric, split_part(x, '|', 2), split_part(x, '|', 3), split_part(x, '|', 4), split_part(x, '|', 5)
  from unnest(res) as x;
end $verif$;

-- Caso 12 / 14: los datos quedaron como estaban (no hay usuarios de prueba).
insert into _verificacion_coberturas
select 40, 'Limpieza', 'No quedaron datos de prueba',
       case when count(*) = 0 then 'OK' else 'FALLA' end, count(*) || ' usuarios de prueba'
from auth.users where email like 'verif-%@clinvi.test';

select orden, caso, verificacion, estado, detalle from _verificacion_coberturas order by orden;
