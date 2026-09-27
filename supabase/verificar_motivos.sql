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

-- C) Profesionales sin motivos en especialidades que sí tienen motivos.
select p.nombre, p.especialidad, p.estado
from public.profesionales p
where exists (select 1 from public.motivos_consulta m where m.especialidad = p.especialidad and m.activo)
  and not exists (select 1 from public.profesional_motivos pm where pm.profesional_id = p.id)
order by p.nombre;

-- D) Inconsistencias de especialidad (esperado: 0 filas).
select p.nombre, p.especialidad, m.especialidad as especialidad_motivo, m.motivo
from public.profesional_motivos pm
join public.profesionales p on p.id = pm.profesional_id
join public.motivos_consulta m on m.id = pm.motivo_id
where m.especialidad <> p.especialidad;

-- E) Profesionales con más de 8 motivos (esperado: 0 filas).
select profesional_id, count(*) from public.profesional_motivos
group by profesional_id having count(*) > 8;

-- F) Duplicados especialidad + motivo (esperado: 0 filas).
select especialidad, public.normalizar(motivo), count(*)
from public.motivos_consulta
group by 1, 2 having count(*) > 1;
