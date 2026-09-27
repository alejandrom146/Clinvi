-- =====================================================================
-- Convertir un usuario de Supabase Auth en ADMINISTRADOR
-- 1) Creá el usuario: Supabase → Authentication → Users → Add user
--    (marcá "Auto Confirm User") o registrate desde la app.
-- 2) Reemplazá el email de abajo y ejecutá este script en el SQL Editor.
-- =====================================================================

insert into public.profiles (id, email, rol)
select id, email, 'admin'
from auth.users
where email = 'admin@tudominio.com'
on conflict (id) do update set rol = 'admin';

-- Verificación
select id, email, rol from public.profiles where rol = 'admin';
