-- Elimina TODOS los datos demo (profesionales is_demo = true).
-- Sus horarios, turnos y reseñas se borran en cascada. No toca datos reales.
delete from public.profesionales where is_demo = true;
