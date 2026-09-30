-- =====================================================================
-- ClinVi — Datos para las pruebas de integración (npm run test:integration)
--
-- ⚠️  Ejecutar SOLO en un proyecto de Supabase DE PRUEBA, nunca en producción.
-- Requiere: schema.sql, motivos_consulta.sql, coberturas.sql, coberturas_import.sql y destacados.sql.
-- Es re-ejecutable: borra y recrea sus propios datos (ids fijos 00000000-0000-4000-9000-…).
-- Para limpiar sin recrear: tests/integration/fixture_cleanup.sql
-- =====================================================================

delete from public.profesionales where id::text like '00000000-0000-4000-9000-%';
delete from public.coberturas where id = '00000000-0000-4000-9000-00000000c0f1';
delete from public.motivos_consulta where id = '00000000-0000-4000-9000-00000000a0f1';

-- Motivo propio de la prueba: se vincula y después se desactiva.
insert into public.motivos_consulta (id, especialidad, motivo, activo, notas)
values ('00000000-0000-4000-9000-00000000a0f1', 'Psicología', 'ZZ Motivo de prueba de integración', true, 'Solo para pruebas');

-- Cobertura propia de la prueba: se vincula y después se desactiva.
insert into public.coberturas (id, tipo, nombre, activo, notas)
values ('00000000-0000-4000-9000-00000000c0f1', 'prepaga', 'ZZ Cobertura de prueba de integración', true, 'Solo para pruebas');

insert into public.profesionales (id, slug, nombre, especialidad, provincia, modalidad, estado, rating, precio) values
  ('00000000-0000-4000-9000-0000000000f1', 'zz-prueba-f1', 'ZZ Prueba Ana', 'Psicología', 'Catamarca', 'ambas', 'activo', 4.9, 20000),
  ('00000000-0000-4000-9000-0000000000f2', 'zz-prueba-f2', 'ZZ Prueba Bruno', 'Psicología', 'Mendoza', 'presencial', 'activo', 4.5, 15000),
  ('00000000-0000-4000-9000-0000000000f3', 'zz-prueba-f3', 'ZZ Prueba Carla', 'Nutrición', 'Córdoba', 'virtual', 'activo', 4.7, 18000),
  ('00000000-0000-4000-9000-0000000000f4', 'zz-prueba-f4', 'ZZ Prueba Diego', 'Psicología', 'Catamarca', 'virtual', 'pendiente', 5.0, 10000),
  ('00000000-0000-4000-9000-0000000000f5', 'zz-prueba-f5', 'ZZ Prueba Elena', 'Psicología', 'Salta', 'virtual', 'activo', 4.1, null);

insert into public.profesional_motivos (profesional_id, motivo_id)
select v.pid::uuid, m.id
from (values
  ('00000000-0000-4000-9000-0000000000f1', 'Psicología', 'Ansiedad'),
  ('00000000-0000-4000-9000-0000000000f1', 'Psicología', 'Trastornos alimentarios'),
  ('00000000-0000-4000-9000-0000000000f2', 'Psicología', 'Ansiedad'),
  ('00000000-0000-4000-9000-0000000000f3', 'Nutrición', 'Trastornos alimentarios'),
  ('00000000-0000-4000-9000-0000000000f4', 'Psicología', 'Ansiedad'),
  ('00000000-0000-4000-9000-0000000000f5', 'Psicología', 'Duelo')
) as v(pid, esp, motivo)
join public.motivos_consulta m on m.especialidad = v.esp and m.motivo = v.motivo;

insert into public.profesional_motivos (profesional_id, motivo_id)
values ('00000000-0000-4000-9000-0000000000f5', '00000000-0000-4000-9000-00000000a0f1');

insert into public.profesional_coberturas (profesional_id, cobertura_id)
select v.pid::uuid, c.id
from (values
  ('00000000-0000-4000-9000-0000000000f1', 'OSDE', null),
  ('00000000-0000-4000-9000-0000000000f1', 'OSEP', 'Catamarca'),
  ('00000000-0000-4000-9000-0000000000f1', '(particular)', null),
  ('00000000-0000-4000-9000-0000000000f2', 'OSEP', 'Mendoza'),
  ('00000000-0000-4000-9000-0000000000f3', 'OSDE', null),
  ('00000000-0000-4000-9000-0000000000f4', 'OSDE', null),
  ('00000000-0000-4000-9000-0000000000f5', 'PAMI', null),
  ('00000000-0000-4000-9000-0000000000f5', '(zz)', null)
) as v(pid, sigla, provincia)
join public.coberturas c
  on (v.sigla = '(particular)' and c.tipo = 'otra' and c.nombre like 'Particular%')
  or (v.sigla = '(zz)' and c.id = '00000000-0000-4000-9000-00000000c0f1')
  or (c.sigla = v.sigla and c.provincia is not distinct from v.provincia);

-- La cobertura de prueba se desactiva DESPUÉS de vincularla (vínculo histórico).
update public.coberturas set activo = false where id = '00000000-0000-4000-9000-00000000c0f1';
update public.motivos_consulta set activo = false where id = '00000000-0000-4000-9000-00000000a0f1';

-- Elena (puntuación 4.1) es "Destacado Plus": debe aparecer antes que Ana (4.9) en Recomendados.
update public.profesionales set destacado_nivel = 2 where id = '00000000-0000-4000-9000-0000000000f5';

-- Control: se esperan 7 vínculos de motivos y 8 de coberturas.
select
  (select count(*) from public.profesional_motivos where profesional_id::text like '00000000-0000-4000-9000-%') as motivos_vinculados, -- 7
  (select count(*) from public.profesional_coberturas where profesional_id::text like '00000000-0000-4000-9000-%') as coberturas_vinculadas; -- 8
