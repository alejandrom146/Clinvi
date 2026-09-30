-- =====================================================================
-- ClinVi — Verificación de profesionales destacados
-- Ejecutar en Supabase → SQL Editor → Run, DESPUÉS de destacados.sql.
-- Crea datos de prueba y los REVIERTE al terminar. Resultado: todas las filas en OK.
-- Si tu proyecto no permite escribir en auth.users desde el SQL Editor, verás una fila ERROR.
-- =====================================================================

drop table if exists _verificacion_destacados;
create temp table _verificacion_destacados (orden int, verificacion text, estado text, detalle text);

do $verif$
declare
  u_pro uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  pid uuid;
  v_n int;
  v_rating numeric;
  res text[] := '{}';
begin
  begin -- bloque que se revierte
    insert into auth.users (id, email, raw_user_meta_data) values
      (u_pro, 'verif-dest-pro@clinvi.test', jsonb_build_object('tipo', 'profesional', 'nombre', 'Verif Destacado', 'especialidad', 'Psicología')),
      (u_admin, 'verif-dest-admin@clinvi.test', '{}'::jsonb);
    update public.profiles set rol = 'admin' where id = u_admin;
    select id, destacado_nivel into pid, v_n from public.profesionales where user_id = u_pro;
    res := res || format('1|Un alta nueva empieza sin destacar|%s|nivel %s', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);
    update public.profesionales set estado = 'activo', rating = 4.2, resenas_count = 5 where id = pid;

    -- Profesional intenta destacarse a sí mismo.
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profesionales set destacado_nivel = 3 where id = pid;
    reset role;
    select destacado_nivel into v_n from public.profesionales where id = pid;
    res := res || format('2|Un profesional no puede destacarse a sí mismo|%s|nivel %s', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    -- Visitante anónimo.
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    update public.profesionales set destacado_nivel = 3 where id = pid;
    reset role;
    select destacado_nivel into v_n from public.profesionales where id = pid;
    res := res || format('3|Un visitante no puede destacar a nadie|%s|nivel %s', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    -- Admin asigna nivel 2.
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profesionales set destacado_nivel = 2 where id = pid;
    reset role;
    select destacado_nivel, rating into v_n, v_rating from public.profesionales where id = pid;
    res := res || format('4|Un admin puede asignar el nivel|%s|nivel %s', case when v_n = 2 then 'OK' else 'FALLA' end, v_n);
    res := res || format('5|Destacar no cambia la puntuación de pacientes|%s|rating %s', case when v_rating = 4.2 then 'OK' else 'FALLA' end, v_rating);

    -- El profesional edita su perfil: no puede bajarse ni subirse el nivel, y su edición funciona.
    perform set_config('request.jwt.claims', json_build_object('sub', u_pro, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profesionales set bio = 'Bio editada', destacado_nivel = 0 where id = pid;
    reset role;
    select destacado_nivel into v_n from public.profesionales where id = pid and bio = 'Bio editada';
    res := res || format('6|Al editar su perfil, el profesional conserva el nivel que puso el admin|%s|nivel %s', case when v_n = 2 then 'OK' else 'FALLA' end, coalesce(v_n::text, 'edición no guardada'));

    -- Valores fuera de rango se rechazan (incluso para admin).
    begin
      update public.profesionales set destacado_nivel = 4 where id = pid;
      res := res || text '7|Solo se aceptan niveles de 0 a 3|FALLA|nivel 4 aceptado';
    exception when check_violation then
      res := res || text '7|Solo se aceptan niveles de 0 a 3|OK|check_violation';
    end;

    -- Admin quita el destacado.
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profesionales set destacado_nivel = 0 where id = pid;
    reset role;
    select destacado_nivel into v_n from public.profesionales where id = pid;
    res := res || format('8|Un admin puede quitar el destacado|%s|nivel %s', case when v_n = 0 then 'OK' else 'FALLA' end, v_n);

    raise exception 'ROLLBACK_VERIFICACION';
  exception when others then
    reset role;
    if sqlerrm <> 'ROLLBACK_VERIFICACION' then
      res := res || format('99|La verificación se interrumpió|ERROR|%s', sqlerrm);
    end if;
  end;

  insert into _verificacion_destacados
  select split_part(x, '|', 1)::int, split_part(x, '|', 2), split_part(x, '|', 3), split_part(x, '|', 4) from unnest(res) as x;
end $verif$;

select * from _verificacion_destacados order by orden;
