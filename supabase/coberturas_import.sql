-- =====================================================================
-- ClinVi — Carga inicial de coberturas (GENERADO, no editar a mano)
-- Origen: supabase/data/coberturas.csv (78 filas)
--   obra_social_nacional: 33 · obra_social_provincial: 24
--   prepaga: 20 · otra: 1
-- Regenerar con: npm run coberturas:generar-sql
--
-- Ejecutar DESPUÉS de supabase/coberturas.sql, en Supabase → SQL Editor → Run.
--
-- Es seguro re-ejecutarlo:
--   * Solo INSERTA las coberturas que todavía no existen (identidad = nombre + provincia).
--   * NUNCA modifica una cobertura existente: no la reactiva, no pisa notas,
--     no cambia sigla ni tipo. Los cambios del panel admin se respetan.
--   * Si una fila choca con otra cobertura por sigla + provincia, NO se inserta
--     y se informa como "conflicto_revisar".
--   * El SQL Editor de Supabase ejecuta todo el script en UNA transacción:
--     si algo falla, no queda nada a medias. Con psql, usar la opción -1:
--       psql "$DATABASE_URL" -1 -v ON_ERROR_STOP=1 -f supabase/coberturas_import.sql
--
-- El resultado final lista cada fila del CSV con la acción aplicada:
--   insertada · ya_existia_igual · ya_existia_con_cambios_admin · conflicto_revisar
-- =====================================================================

drop table if exists _coberturas_csv;
drop table if exists _coberturas_resultado;

create temp table _coberturas_csv (
  fila int primary key,
  tipo text not null,
  nombre text not null,
  sigla text,
  provincia text,
  activo boolean not null,
  notas text
);

insert into _coberturas_csv (fila, tipo, nombre, sigla, provincia, activo, notas) values
  (2, 'obra_social_nacional', 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI)', 'PAMI', null, true, null),
  (3, 'obra_social_nacional', 'Obra Social de las Fuerzas Armadas', 'OSFA', null, true, 'Creada por DNU 88/2026 en reemplazo de IOSFA (Ejército, Armada y Fuerza Aérea).'),
  (4, 'obra_social_nacional', 'Obra Social de las Fuerzas Federales de Seguridad', 'OSFFESEG', null, true, 'Creada por DNU 88/2026 en reemplazo de IOSFA (Gendarmería y Prefectura).'),
  (5, 'obra_social_nacional', 'Instituto de Obra Social de las Fuerzas Armadas y de Seguridad', 'IOSFA', null, false, 'En disolución (DNU 88/2026). Afiliados transferidos a OSFA y OSFFESEG.'),
  (6, 'obra_social_nacional', 'Obra Social del Poder Judicial de la Nación', 'OSPJN', null, true, null),
  (7, 'obra_social_nacional', 'Dirección de Obra Social de la Universidad de Buenos Aires', 'DOSUBA', null, true, null),
  (8, 'obra_social_nacional', 'Obra Social de los Empleados de Comercio y Actividades Civiles', 'OSECAC', null, true, null),
  (9, 'obra_social_nacional', 'Obra Social del Personal Rural y Estibadores de la República Argentina', 'OSPRERA', null, true, null),
  (10, 'obra_social_nacional', 'Obra Social de la Unión Obrera Metalúrgica', 'OSUOMRA', null, true, null),
  (11, 'obra_social_nacional', 'Obra Social del Personal de la Construcción', 'OSPECON', null, true, null),
  (12, 'obra_social_nacional', 'Obra Social de Mecánicos y Afines del Transporte Automotor', 'OSMATA', null, true, null),
  (13, 'obra_social_nacional', 'Obra Social de Choferes de Camiones', 'OSCHOCA', null, true, null),
  (14, 'obra_social_nacional', 'Obra Social para la Actividad Docente', 'OSPLAD', null, true, null),
  (15, 'obra_social_nacional', 'Obra Social del Personal de la Sanidad Argentina', 'OSPSA', null, true, null),
  (16, 'obra_social_nacional', 'Obra Social Bancaria Argentina', 'OSBA', null, true, null),
  (17, 'obra_social_nacional', 'Unión Personal (Unión del Personal Civil de la Nación)', 'UP', null, true, null),
  (18, 'obra_social_nacional', 'Obra Social del Personal de Entidades Deportivas y Civiles', 'OSPEDYC', null, true, null),
  (19, 'obra_social_nacional', 'Obra Social de la Unión de Trabajadores del Turismo, Hoteleros y Gastronómicos', 'OSUTHGRA', null, true, null),
  (20, 'obra_social_nacional', 'Obra Social de Petroleros', 'OSPE', null, true, null),
  (21, 'obra_social_nacional', 'Obra Social del Personal de la Industria de la Alimentación', 'OSPIA', null, true, null),
  (22, 'obra_social_nacional', 'Obra Social del Personal de la Industria Maderera', 'OSPIM', null, true, null),
  (23, 'obra_social_nacional', 'Obra Social del Personal de la Industria Textil', 'OSPIT', null, true, null),
  (24, 'obra_social_nacional', 'Obra Social del Personal de la Industria del Plástico', 'OSPIP', null, true, null),
  (25, 'obra_social_nacional', 'Obra Social del Personal de la Industria Química y Petroquímica', 'OSPIQYP', null, true, null),
  (26, 'obra_social_nacional', 'Obra Social del Personal de Edificios de Renta y Horizontal', 'OSPERYH', null, true, null),
  (27, 'obra_social_nacional', 'Obra Social de Seguros', 'OSSEG', null, true, null),
  (28, 'obra_social_nacional', 'Obra Social del Personal de Telecomunicaciones', 'OSPETELCO', null, true, null),
  (29, 'obra_social_nacional', 'Obra Social de la Federación Argentina de Trabajadores de Luz y Fuerza', 'OSFATLYF', null, true, null),
  (30, 'obra_social_nacional', 'Obra Social del Personal de Organismos de Control Externo', 'OSPOCE', null, true, null),
  (31, 'obra_social_nacional', 'Obra Social Ferroviaria', 'OSFE', null, true, null),
  (32, 'obra_social_nacional', 'Obra Social de Conductores de Transporte Colectivo de Pasajeros', 'OSCTCP', null, true, null),
  (33, 'obra_social_nacional', 'Obra Social de Viajantes Vendedores de la República Argentina (ANDAR)', 'ANDAR', null, true, null),
  (34, 'obra_social_nacional', 'Obra Social Luis Pasteur', 'Luis Pasteur', null, true, null),
  (35, 'obra_social_provincial', 'Instituto de Obra Médico Asistencial', 'IOMA', 'Buenos Aires', true, null),
  (36, 'obra_social_provincial', 'Obra Social de la Ciudad de Buenos Aires', 'ObSBA', 'CABA', true, null),
  (37, 'obra_social_provincial', 'Obra Social de los Empleados Públicos de Catamarca', 'OSEP', 'Catamarca', true, null),
  (38, 'obra_social_provincial', 'Instituto de Seguridad Social, Seguros y Préstamos', 'INSSSEP', 'Chaco', true, null),
  (39, 'obra_social_provincial', 'Servicio Provincial de Obra Social', 'SEROS', 'Chubut', true, null),
  (40, 'obra_social_provincial', 'Administración Provincial del Seguro de Salud', 'APROSS', 'Córdoba', true, null),
  (41, 'obra_social_provincial', 'Instituto de Obra Social de Corrientes', 'IOSCOR', 'Corrientes', true, null),
  (42, 'obra_social_provincial', 'Obra Social de Entre Ríos', 'OSER', 'Entre Ríos', true, 'Reemplazó al IOSPER.'),
  (43, 'obra_social_provincial', 'Instituto de Asistencia Social para Empleados Públicos', 'IASEP', 'Formosa', true, null),
  (44, 'obra_social_provincial', 'Instituto de Seguros de Jujuy', 'ISJ', 'Jujuy', true, null),
  (45, 'obra_social_provincial', 'SEMPRE', 'SEMPRE', 'La Pampa', true, null),
  (46, 'obra_social_provincial', 'Administración Provincial de Obra Social', 'APOS', 'La Rioja', true, null),
  (47, 'obra_social_provincial', 'Obra Social de Empleados Públicos de Mendoza', 'OSEP', 'Mendoza', true, null),
  (48, 'obra_social_provincial', 'Instituto de Previsión Social de Misiones', 'IPS', 'Misiones', true, null),
  (49, 'obra_social_provincial', 'Instituto de Seguridad Social del Neuquén', 'ISSN', 'Neuquén', true, null),
  (50, 'obra_social_provincial', 'Instituto Provincial del Seguro de Salud', 'IPROSS', 'Río Negro', true, null),
  (51, 'obra_social_provincial', 'Instituto Provincial de Salud de Salta', 'IPS', 'Salta', true, null),
  (52, 'obra_social_provincial', 'Obra Social Provincia de San Juan', 'OSP', 'San Juan', true, null),
  (53, 'obra_social_provincial', 'Dirección de Obra Social del Estado Provincial', 'DOSEP', 'San Luis', true, null),
  (54, 'obra_social_provincial', 'Caja de Servicios Sociales', 'CSS', 'Santa Cruz', true, null),
  (55, 'obra_social_provincial', 'Instituto Autárquico Provincial de Obra Social', 'IAPOS', 'Santa Fe', true, null),
  (56, 'obra_social_provincial', 'Instituto de Obra Social del Empleado Provincial', 'IOSEP', 'Santiago del Estero', true, null),
  (57, 'obra_social_provincial', 'Obra Social del Estado Fueguino', 'OSEF', 'Tierra del Fuego', true, null),
  (58, 'obra_social_provincial', 'Subsidio de Salud (Instituto de Previsión y Seguridad Social)', 'Subsidio de Salud', 'Tucumán', true, null),
  (59, 'prepaga', 'OSDE', 'OSDE', null, true, null),
  (60, 'prepaga', 'Swiss Medical', null, null, true, null),
  (61, 'prepaga', 'Galeno', null, null, true, null),
  (62, 'prepaga', 'Medifé', null, null, true, null),
  (63, 'prepaga', 'Omint', null, null, true, null),
  (64, 'prepaga', 'Sancor Salud', null, null, true, null),
  (65, 'prepaga', 'Prevención Salud', null, null, true, null),
  (66, 'prepaga', 'Avalian', null, null, true, 'Ex ACA Salud.'),
  (67, 'prepaga', 'Medicus', null, null, true, null),
  (68, 'prepaga', 'Premedic', null, null, true, null),
  (69, 'prepaga', 'Federada Salud', null, null, true, null),
  (70, 'prepaga', 'Jerárquicos Salud', null, null, true, null),
  (71, 'prepaga', 'Accord Salud', null, null, true, null),
  (72, 'prepaga', 'Plan de Salud Hospital Italiano', null, null, true, null),
  (73, 'prepaga', 'Plan Médico Hospital Alemán', null, null, true, null),
  (74, 'prepaga', 'Plan de Salud Hospital Británico', null, null, true, null),
  (75, 'prepaga', 'CEMIC', null, null, true, null),
  (76, 'prepaga', 'La Pequeña Familia', null, null, true, null),
  (77, 'prepaga', 'MET Medicina Privada', null, 'Córdoba', true, null),
  (78, 'prepaga', 'Boreal Salud', null, 'Tucumán', true, null),
  (79, 'otra', 'Particular (sin cobertura)', null, null, true, 'Opción para pacientes que abonan la consulta.');

-- Verificación de integridad del lote (aborta toda la carga si no coincide).
do $$
declare
  v_total int;
begin
  select count(*) into v_total from _coberturas_csv;
  if v_total <> 78 then
    raise exception 'IMPORTACION_ABORTADA: se esperaban 78 filas y hay %', v_total;
  end if;
end $$;

create temp table _coberturas_resultado as
select
  c.fila,
  c.tipo,
  c.nombre,
  c.sigla,
  c.provincia,
  case
    when e.id is not null and (e.tipo, e.sigla, e.activo, e.notas) is not distinct from (c.tipo, c.sigla, c.activo, c.notas)
      then 'ya_existia_igual'
    when e.id is not null then 'ya_existia_con_cambios_admin'
    when s.id is not null then 'conflicto_revisar'
    else 'insertada'
  end as accion,
  coalesce(e.id, s.id) as cobertura_existente_id,
  case
    when e.id is not null and (e.tipo, e.sigla, e.activo, e.notas) is distinct from (c.tipo, c.sigla, c.activo, c.notas)
      then 'La cobertura ya existe con datos distintos al CSV (probablemente editada en el panel). No se modificó.'
    when e.id is null and s.id is not null
      then 'Otra cobertura ("' || s.nombre || '") ya usa la sigla ' || c.sigla || ' en la misma provincia. No se insertó.'
  end as detalle
from _coberturas_csv c
left join public.coberturas e
  on public.normalizar(e.nombre) = public.normalizar(c.nombre)
 and coalesce(e.provincia, '') = coalesce(c.provincia, '')
left join public.coberturas s
  on e.id is null
 and c.sigla is not null
 and public.normalizar(s.sigla) = public.normalizar(c.sigla)
 and coalesce(s.provincia, '') = coalesce(c.provincia, '');

insert into public.coberturas (tipo, nombre, sigla, provincia, activo, notas, origen)
select c.tipo, c.nombre, c.sigla, c.provincia, c.activo, c.notas, 'csv_inicial'
from _coberturas_csv c
join _coberturas_resultado r on r.fila = c.fila and r.accion = 'insertada'
order by c.fila
on conflict do nothing;

-- Verificación posterior: cada fila "insertada" debe existir ahora en la tabla.
do $$
declare
  v_faltan int;
begin
  select count(*) into v_faltan
  from _coberturas_resultado r
  where r.accion = 'insertada'
    and not exists (
      select 1 from public.coberturas c
      where public.normalizar(c.nombre) = public.normalizar(r.nombre)
        and coalesce(c.provincia, '') = coalesce(r.provincia, ''));
  if v_faltan > 0 then
    raise exception 'IMPORTACION_ABORTADA: % fila(s) marcadas como insertadas no quedaron en la tabla', v_faltan;
  end if;
end $$;

-- Resultado (una fila por registro del CSV). Revisá las que no digan "insertada" o "ya_existia_igual".
select accion, count(*) over (partition by accion) as total_accion, fila, tipo, nombre, sigla, provincia, detalle
from _coberturas_resultado
order by case accion when 'conflicto_revisar' then 0 when 'ya_existia_con_cambios_admin' then 1 when 'insertada' then 2 else 3 end, fila;
