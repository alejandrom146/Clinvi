-- =====================================================================
-- ClinVi — Esquema completo de base de datos (Supabase / PostgreSQL)
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es re-ejecutable (usa IF NOT EXISTS / DROP ... IF EXISTS).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Funciones utilitarias
-- ---------------------------------------------------------------------
create or replace function public.normalizar(txt text)
returns text language sql immutable as $$
  select translate(lower(coalesce(txt, '')),
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc');
$$;

create or replace function public.slugify(txt text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(public.normalizar(txt), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

-- Un perfil por usuario de Supabase Auth (las contraseñas las maneja Supabase Auth).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'profesional' check (rol in ('profesional', 'admin')),
  nombre text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profesionales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  slug text not null unique,
  nombre text not null check (char_length(nombre) between 2 and 120),
  especialidad text not null,
  subtitulo text check (subtitulo is null or char_length(subtitulo) <= 160),
  bio text check (bio is null or char_length(bio) <= 3000),
  matricula text,
  provincia text,
  habilidades text[] not null default '{}',
  motivos text[] not null default '{}',
  modalidad text not null default 'virtual' check (modalidad in ('virtual', 'presencial', 'ambas')),
  precio integer check (precio is null or precio >= 0),
  whatsapp text,
  avatar_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'rechazado', 'inactivo')),
  rating numeric(2,1) not null default 0,
  resenas_count integer not null default 0,
  search_text text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profesionales_estado_idx on public.profesionales (estado);
create index if not exists profesionales_especialidad_idx on public.profesionales (especialidad);
create index if not exists profesionales_provincia_idx on public.profesionales (provincia);
create index if not exists profesionales_rating_idx on public.profesionales (rating desc);
create index if not exists profesionales_motivos_idx on public.profesionales using gin (motivos);

-- Horarios semanales recurrentes. dia_semana: 0=domingo … 6=sábado (igual que JavaScript).
create table if not exists public.horarios (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  unique (profesional_id, dia_semana, hora)
);

create index if not exists horarios_profesional_idx on public.horarios (profesional_id);

create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  fecha date not null,
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  pac_nombre text not null check (char_length(pac_nombre) between 2 and 120),
  pac_email text not null check (pac_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  pac_whatsapp text check (pac_whatsapp is null or char_length(pac_whatsapp) <= 30),
  pac_motivo text check (pac_motivo is null or char_length(pac_motivo) <= 500),
  estado text not null default 'confirmado' check (estado in ('confirmado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Impide reservas duplicadas: un único turno confirmado por profesional + fecha + hora.
create unique index if not exists turnos_slot_unico
  on public.turnos (profesional_id, fecha, hora) where estado = 'confirmado';
create index if not exists turnos_profesional_fecha_idx on public.turnos (profesional_id, fecha);

create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  puntuacion smallint not null check (puntuacion between 1 and 5),
  nombre text check (nombre is null or char_length(nombre) <= 80),
  comentario text check (comentario is null or char_length(comentario) <= 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resenas_profesional_estado_idx on public.resenas (profesional_id, estado);

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

-- ---------------------------------------------------------------------
-- Slugs únicos (URL pública /profesionales/<slug>)
-- ---------------------------------------------------------------------
create or replace function public.generate_unique_slug(base text)
returns text language plpgsql security definer set search_path = public as $$
declare
  s text := coalesce(nullif(public.slugify(base), ''), 'profesional');
  candidate text := s;
  n int := 1;
begin
  while exists (select 1 from public.profesionales where slug = candidate) loop
    n := n + 1;
    candidate := s || '-' || n;
  end loop;
  return candidate;
end $$;

revoke execute on function public.generate_unique_slug(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Alta automática al registrarse (Supabase Auth → profiles + profesionales)
-- El rol SIEMPRE es 'profesional' y el estado SIEMPRE 'pendiente'.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_precio int;
begin
  insert into public.profiles (id, rol, nombre, email)
  values (new.id, 'profesional', nullif(meta->>'nombre', ''), new.email)
  on conflict (id) do nothing;

  if meta->>'tipo' = 'profesional' then
    begin
      v_precio := nullif(meta->>'precio', '')::int;
    exception when others then
      v_precio := null;
    end;

    insert into public.profesionales (
      user_id, slug, nombre, especialidad, subtitulo, bio, matricula, provincia,
      habilidades, motivos, modalidad, precio, whatsapp, estado
    ) values (
      new.id,
      public.generate_unique_slug(meta->>'nombre'),
      coalesce(nullif(trim(meta->>'nombre'), ''), 'Profesional'),
      coalesce(nullif(meta->>'especialidad', ''), 'Medicina clínica'),
      nullif(meta->>'subtitulo', ''),
      nullif(meta->>'bio', ''),
      nullif(meta->>'matricula', ''),
      nullif(meta->>'provincia', ''),
      coalesce(array(select jsonb_array_elements_text(
        case when jsonb_typeof(meta->'habilidades') = 'array' then meta->'habilidades' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(
        case when jsonb_typeof(meta->'motivos') = 'array' then meta->'motivos' else '[]'::jsonb end)), '{}'),
      case when meta->>'modalidad' in ('virtual', 'presencial', 'ambas') then meta->>'modalidad' else 'virtual' end,
      v_precio,
      nullif(meta->>'whatsapp', ''),
      'pendiente'
    );
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Protección de campos sensibles (no SECURITY DEFINER a propósito:
-- current_user = 'authenticated'/'anon' cuando la llamada viene de la API).
-- Un profesional NO puede cambiar su estado, puntuación, matrícula, etc.
-- ---------------------------------------------------------------------
create or replace function public.protect_profesional_fields()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.rating := 0;
    new.resenas_count := 0;
    new.is_demo := false;
    new.user_id := auth.uid();
  else
    new.estado := old.estado;
    new.rating := old.rating;
    new.resenas_count := old.resenas_count;
    new.is_demo := old.is_demo;
    new.user_id := old.user_id;
    new.slug := old.slug;
    new.matricula := old.matricula;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

create or replace function public.profesionales_search_text()
returns trigger language plpgsql as $$
begin
  new.search_text := public.normalizar(concat_ws(' ',
    new.nombre, new.especialidad, new.subtitulo, new.bio, new.provincia,
    array_to_string(new.habilidades, ' '), array_to_string(new.motivos, ' ')));
  return new;
end $$;

drop trigger if exists a_protect_profesional on public.profesionales;
create trigger a_protect_profesional
  before insert or update on public.profesionales
  for each row execute function public.protect_profesional_fields();

drop trigger if exists b_search_text_profesional on public.profesionales;
create trigger b_search_text_profesional
  before insert or update on public.profesionales
  for each row execute function public.profesionales_search_text();

drop trigger if exists c_updated_at_profesional on public.profesionales;
create trigger c_updated_at_profesional
  before update on public.profesionales
  for each row execute function public.set_updated_at();

drop trigger if exists updated_at_profiles on public.profiles;
create trigger updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Un profesional solo puede cambiar el estado de sus turnos (p. ej. cancelar).
create or replace function public.protect_turno_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  new.profesional_id := old.profesional_id;
  new.fecha := old.fecha;
  new.hora := old.hora;
  new.pac_nombre := old.pac_nombre;
  new.pac_email := old.pac_email;
  new.pac_whatsapp := old.pac_whatsapp;
  new.pac_motivo := old.pac_motivo;
  new.created_at := old.created_at;
  return new;
end $$;

drop trigger if exists protect_turno on public.turnos;
create trigger protect_turno
  before update on public.turnos
  for each row execute function public.protect_turno_fields();

drop trigger if exists updated_at_resenas on public.resenas;
create trigger updated_at_resenas
  before update on public.resenas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Puntuación promedio automática (solo reseñas aprobadas)
-- ---------------------------------------------------------------------
create or replace function public.recalcular_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if tg_op = 'DELETE' then
    pid := old.profesional_id;
  else
    pid := new.profesional_id;
  end if;

  update public.profesionales p set
    rating = coalesce((select round(avg(r.puntuacion)::numeric, 1) from public.resenas r
                       where r.profesional_id = pid and r.estado = 'aprobada'), 0),
    resenas_count = (select count(*) from public.resenas r
                     where r.profesional_id = pid and r.estado = 'aprobada')
  where p.id = pid;

  return null;
end $$;

drop trigger if exists resenas_rating on public.resenas;
create trigger resenas_rating
  after insert or update or delete on public.resenas
  for each row execute function public.recalcular_rating();

-- ---------------------------------------------------------------------
-- Reservas (RPC). Los datos de pacientes NO son legibles públicamente:
-- el público solo puede ver qué horas están ocupadas y reservar vía función.
-- ---------------------------------------------------------------------
create or replace function public.horarios_ocupados(p_profesional_id uuid, p_fecha date)
returns table (hora text) language sql stable security definer set search_path = public as $$
  select t.hora
  from public.turnos t
  join public.profesionales p on p.id = t.profesional_id
  where t.profesional_id = p_profesional_id
    and t.fecha = p_fecha
    and t.estado = 'confirmado'
    and p.estado = 'activo';
$$;

create or replace function public.reservar_turno(
  p_profesional_id uuid,
  p_fecha date,
  p_hora text,
  p_nombre text,
  p_email text,
  p_whatsapp text default null,
  p_motivo text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_ahora text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI');
begin
  if not exists (select 1 from public.profesionales where id = p_profesional_id and estado = 'activo') then
    raise exception 'PROFESIONAL_NO_DISPONIBLE';
  end if;

  if p_fecha < v_hoy or p_fecha > v_hoy + 90 then
    raise exception 'FECHA_INVALIDA';
  end if;

  if p_fecha = v_hoy and p_hora <= v_ahora then
    raise exception 'HORARIO_PASADO';
  end if;

  if not exists (
    select 1 from public.horarios
    where profesional_id = p_profesional_id
      and dia_semana = extract(dow from p_fecha)::int
      and hora = p_hora
  ) then
    raise exception 'HORARIO_INEXISTENTE';
  end if;

  if coalesce(char_length(trim(p_nombre)), 0) < 2 then
    raise exception 'DATOS_INVALIDOS';
  end if;

  begin
    insert into public.turnos (profesional_id, fecha, hora, pac_nombre, pac_email, pac_whatsapp, pac_motivo)
    values (
      p_profesional_id, p_fecha, p_hora,
      trim(p_nombre), lower(trim(p_email)),
      nullif(trim(coalesce(p_whatsapp, '')), ''),
      nullif(trim(coalesce(p_motivo, '')), '')
    )
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'HORARIO_OCUPADO';
    when check_violation then
      raise exception 'DATOS_INVALIDOS';
  end;

  return v_id;
end $$;

grant execute on function public.horarios_ocupados(uuid, date) to anon, authenticated;
grant execute on function public.reservar_turno(uuid, date, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profesionales enable row level security;
alter table public.horarios enable row level security;
alter table public.turnos enable row level security;
alter table public.resenas enable row level security;

-- profiles
drop policy if exists "profiles: ver el propio o admin" on public.profiles;
create policy "profiles: ver el propio o admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: solo admin modifica" on public.profiles;
create policy "profiles: solo admin modifica" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- profesionales
drop policy if exists "profesionales: lectura" on public.profesionales;
create policy "profesionales: lectura" on public.profesionales
  for select using (estado = 'activo' or user_id = auth.uid() or public.is_admin());

drop policy if exists "profesionales: admin crea" on public.profesionales;
create policy "profesionales: admin crea" on public.profesionales
  for insert with check (public.is_admin());

drop policy if exists "profesionales: editar propio o admin" on public.profesionales;
create policy "profesionales: editar propio o admin" on public.profesionales
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "profesionales: admin elimina" on public.profesionales;
create policy "profesionales: admin elimina" on public.profesionales
  for delete using (public.is_admin());

-- horarios
drop policy if exists "horarios: lectura" on public.horarios;
create policy "horarios: lectura" on public.horarios
  for select using (
    exists (select 1 from public.profesionales p where p.id = profesional_id
            and (p.estado = 'activo' or p.user_id = auth.uid()))
    or public.is_admin()
  );

drop policy if exists "horarios: gestionar propios o admin" on public.horarios;
create policy "horarios: gestionar propios o admin" on public.horarios
  for all using (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

-- turnos (las inserciones públicas se hacen SOLO vía reservar_turno)
drop policy if exists "turnos: ver propios o admin" on public.turnos;
create policy "turnos: ver propios o admin" on public.turnos
  for select using (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "turnos: actualizar propios o admin" on public.turnos;
create policy "turnos: actualizar propios o admin" on public.turnos
  for update using (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.profesionales p where p.id = profesional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "turnos: admin elimina" on public.turnos;
create policy "turnos: admin elimina" on public.turnos
  for delete using (public.is_admin());

-- resenas
drop policy if exists "resenas: lectura" on public.resenas;
create policy "resenas: lectura" on public.resenas
  for select using (estado = 'aprobada' or public.is_admin());

drop policy if exists "resenas: cualquiera crea pendiente" on public.resenas;
create policy "resenas: cualquiera crea pendiente" on public.resenas
  for insert to anon, authenticated with check (
    estado = 'pendiente'
    and exists (select 1 from public.profesionales p where p.id = profesional_id and p.estado = 'activo')
  );

drop policy if exists "resenas: admin modera" on public.resenas;
create policy "resenas: admin modera" on public.resenas
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "resenas: admin elimina" on public.resenas;
create policy "resenas: admin elimina" on public.resenas
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage: avatares (bucket público de lectura; cada usuario escribe en su carpeta)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: lectura pública" on storage.objects;
create policy "avatars: lectura pública" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars: subir propio" on storage.objects;
create policy "avatars: subir propio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: actualizar propio" on storage.objects;
create policy "avatars: actualizar propio" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: borrar propio" on storage.objects;
create policy "avatars: borrar propio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
