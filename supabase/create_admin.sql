-- =====================================================================
-- ClinVi — Cuentas de ADMINISTRACIÓN
--
-- Recomendado para cuentas nuevas: crealas en Supabase → Authentication →
-- Users → Add user (marcá "Auto Confirm User"). Así NO se crea una ficha
-- profesional. Si la registrás desde el formulario de la app, se crea una
-- ficha profesional pendiente que después hay que desvincular (paso 2).
--
-- Una cuenta de administración siempre entra a /admin: el panel profesional
-- (/panel) la redirige automáticamente.
-- =====================================================================

-- 1) Dar rol de administradora y el nombre que se muestra en el panel.
--    Reemplazá emails y nombres. Podés dejar una sola fila o agregar más.
insert into public.profiles (id, email, rol, nombre)
select u.id, u.email, 'admin', a.nombre
from (values
  ('pau@tudominio.com',  'Pau'),
  ('flor@tudominio.com', 'Flor')
) as a(email, nombre)
join auth.users u on lower(u.email) = lower(a.email)
on conflict (id) do update set rol = 'admin', nombre = excluded.nombre;

-- 2) (Opcional) Si una cuenta admin tiene una ficha profesional creada por
--    error (por haberse registrado desde el formulario), desvincularla.
--    NO borra nada: la ficha queda inactiva, sin dueño, y se puede eliminar
--    o reasignar después desde Supabase. Quitá los "--" para ejecutarlo.
--
-- update public.profesionales
-- set user_id = null, estado = 'inactivo'
-- where user_id in (select id from public.profiles where rol = 'admin');

-- Verificación: cuentas de administración y si todavía tienen ficha profesional.
select p.email, p.nombre, p.rol,
       (select f.nombre || ' (' || f.estado || ')' from public.profesionales f where f.user_id = p.id) as ficha_profesional_vinculada
from public.profiles p
where p.rol = 'admin'
order by p.email;
