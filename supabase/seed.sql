-- =====================================================================
-- ClinVi — DATOS DEMO (opcional)
-- Ejecutar DESPUÉS de schema.sql y de motivos_consulta.sql. Todos los registros quedan marcados con
-- is_demo = true para separarlos de los datos reales.
-- Para borrarlos: ejecutar supabase/reset_demo.sql
-- =====================================================================

insert into public.profesionales
  (id, slug, nombre, especialidad, subtitulo, bio, matricula, provincia, habilidades, motivos, modalidad, precio, whatsapp, estado, is_demo)
values
  ('d0000000-0000-4000-8000-000000000001', 'paula-fernandez', 'Lic. Paula Fernández', 'Psicología',
   'Psicóloga clínica · Terapia cognitivo-conductual',
   'Acompaño a adultos y adolescentes en procesos de ansiedad, estrés y cambios vitales. Trabajo con un enfoque cognitivo-conductual, con objetivos claros y herramientas prácticas.',
   'MN 45.210', 'Buenos Aires', array['Terapia cognitivo-conductual','Adultos','Adolescentes'],
   array['Ansiedad','Estrés laboral','Ataques de pánico','Duelo'], 'virtual', 18000, '5491100000001', 'activo', true),

  ('d0000000-0000-4000-8000-000000000002', 'martin-sosa', 'Lic. Martín Sosa', 'Nutrición',
   'Nutricionista · Alimentación consciente y deportiva',
   'Planes de alimentación personalizados, sin dietas extremas. Acompaño objetivos de salud, rendimiento deportivo y cambios de hábitos sostenibles.',
   'MP 3.118', 'Córdoba', array['Nutrición deportiva','Plan alimentario','Educación alimentaria'],
   array['Bajar de peso','Nutrición deportiva','Aumentar masa muscular'], 'ambas', 15000, '5493510000002', 'activo', true),

  ('d0000000-0000-4000-8000-000000000003', 'carlos-medina', 'Dr. Carlos Medina', 'Medicina clínica',
   'Médico clínico · Consultas generales y controles',
   'Consultas de clínica médica, controles de salud, lectura de estudios y seguimiento de enfermedades crónicas como hipertensión y diabetes.',
   'MN 98.442', 'Santa Fe', array['Controles de salud','Hipertensión','Diabetes'],
   array['Control anual / chequeo general','Orden de estudios y análisis','Seguimiento de hipertensión o diabetes'], 'virtual', 20000, '5493420000003', 'activo', true),

  ('d0000000-0000-4000-8000-000000000004', 'lucia-herrera', 'Lic. Lucía Herrera', 'Kinesiología',
   'Kinesióloga · Rehabilitación y postura',
   'Evaluación y planes de ejercicio guiados para dolor de espalda, lesiones deportivas y rehabilitación postquirúrgica.',
   'MP 1.907', 'Mendoza', array['Rehabilitación','Ejercicio terapéutico','Postura'],
   array['Dolor lumbar','Lesiones deportivas','Postura y columna'], 'ambas', 14000, '5492610000004', 'activo', true),

  ('d0000000-0000-4000-8000-000000000005', 'valeria-rios', 'Dra. Valeria Ríos', 'Pediatría',
   'Pediatra · Controles de niño sano',
   'Orientación a familias sobre crecimiento, alimentación, sueño y vacunas. Consultas de seguimiento y dudas frecuentes.',
   'MP 7.330', 'Tucumán', array['Niño sano','Lactancia','Vacunas'],
   array['Control pediátrico','Alimentación infantil','Sueño infantil'], 'virtual', 17000, '5493810000005', 'activo', true),

  ('d0000000-0000-4000-8000-000000000006', 'juan-perez', 'Od. Juan Pérez', 'Odontología',
   'Odontólogo · Orientación y urgencias',
   'Consultas de orientación odontológica, evaluación de urgencias y planificación de tratamientos. Atención presencial en consultorio.',
   'MP 2.254', 'Catamarca', array['Odontología general','Urgencias','Estética dental'],
   array['Dolor de muelas','Limpieza dental','Blanqueamiento'], 'presencial', 16000, '5493830000006', 'activo', true),

  ('d0000000-0000-4000-8000-000000000007', 'sofia-alvarez', 'Dra. Sofía Álvarez', 'Dermatología',
   'Dermatóloga · Piel, cabello y uñas',
   'Evaluación de lesiones de piel, acné, dermatitis y rutinas de cuidado. Seguimiento de tratamientos dermatológicos.',
   'MN 77.105', 'Salta', array['Acné','Dermatitis','Cuidado de la piel'],
   array['Acné','Manchas','Caída del cabello'], 'virtual', 19000, '5493870000007', 'activo', true),

  ('d0000000-0000-4000-8000-000000000008', 'camila-torres', 'Lic. Camila Torres', 'Fonoaudiología',
   'Fonoaudióloga · Lenguaje y voz',
   'Evaluación y tratamiento de dificultades del lenguaje en niños, y trabajo de voz para adultos que usan la voz profesionalmente.',
   'MP 1.412', 'Neuquén', array['Lenguaje infantil','Voz','Deglución'],
   array['Retraso del habla','Terapia de voz','Tartamudez'], 'virtual', 13000, '5492990000008', 'activo', true)
on conflict (id) do nothing;

-- Horarios: lunes a viernes 09, 10, 11, 15 y 16 h; sábados 10 y 11 h para algunos.
insert into public.horarios (profesional_id, dia_semana, hora)
select p.id, d, h
from public.profesionales p
cross join generate_series(1, 5) as d
cross join unnest(array['09:00','10:00','11:00','15:00','16:00']) as h
where p.is_demo
on conflict do nothing;

insert into public.horarios (profesional_id, dia_semana, hora)
select p.id, 6, h
from public.profesionales p
cross join unnest(array['10:00','11:00']) as h
where p.is_demo and p.modalidad in ('virtual', 'ambas')
on conflict do nothing;

-- Reseñas aprobadas (la puntuación promedio se recalcula sola por trigger).
insert into public.resenas (profesional_id, puntuacion, nombre, comentario, estado)
select v.pid::uuid, v.puntuacion, v.nombre, v.comentario, 'aprobada'
from (values
  ('d0000000-0000-4000-8000-000000000001', 5, 'Mariana', 'Muy clara y cálida. Me dio herramientas concretas desde la primera sesión.'),
  ('d0000000-0000-4000-8000-000000000001', 5, null, 'Excelente profesional, muy puntual.'),
  ('d0000000-0000-4000-8000-000000000001', 4, 'Diego', 'Buena experiencia, la recomiendo.'),
  ('d0000000-0000-4000-8000-000000000002', 5, 'Sol', 'Un plan realista que pude sostener.'),
  ('d0000000-0000-4000-8000-000000000002', 4, null, 'Muy buena atención.'),
  ('d0000000-0000-4000-8000-000000000003', 5, 'Roberto', 'Explicó mis estudios con mucha paciencia.'),
  ('d0000000-0000-4000-8000-000000000003', 4, 'Ana', 'Atento y concreto.'),
  ('d0000000-0000-4000-8000-000000000004', 5, 'Pablo', 'Los ejercicios me ayudaron muchísimo con la espalda.'),
  ('d0000000-0000-4000-8000-000000000005', 5, 'Florencia', 'Nos tranquilizó mucho como padres primerizos.'),
  ('d0000000-0000-4000-8000-000000000005', 5, null, 'Muy dulce con los chicos.'),
  ('d0000000-0000-4000-8000-000000000006', 4, 'Nelson', 'Me resolvió una urgencia el mismo día.'),
  ('d0000000-0000-4000-8000-000000000007', 5, 'Julieta', 'Por fin encontré una rutina que me funciona.'),
  ('d0000000-0000-4000-8000-000000000008', 5, 'Carla', 'Gran avance con mi hijo en pocas semanas.')
) as v(pid, puntuacion, nombre, comentario)
where not exists (
  select 1 from public.resenas r where r.profesional_id = v.pid::uuid and r.comentario = v.comentario
);

-- Vincula los motivos demo con la lista maestra (requiere motivos_consulta.sql).
-- Solo coincidencias dentro de la misma especialidad; Pediatría, Odontología y
-- Dermatología no tienen motivos maestros y quedan sin vínculos.
insert into public.profesional_motivos (profesional_id, motivo_id)
select distinct p.id, m.id
from public.profesionales p
cross join lateral unnest(p.motivos) as u(txt)
join public.motivos_consulta m
  on m.especialidad = p.especialidad
 and m.activo
 and public.normalizar(m.motivo) = public.normalizar(trim(u.txt))
where p.is_demo
  and not exists (select 1 from public.profesional_motivos pm where pm.profesional_id = p.id)
on conflict do nothing;
