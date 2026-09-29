-- Borra los datos creados por tests/integration/fixture.sql (proyecto de PRUEBA).
delete from public.profesionales where id::text like '00000000-0000-4000-9000-%';
delete from public.coberturas where id = '00000000-0000-4000-9000-00000000c0f1';
delete from public.motivos_consulta where id = '00000000-0000-4000-9000-00000000a0f1';
