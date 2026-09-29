# ClinVi — Plataforma de turnos para profesionales de la salud

Aplicación completa con **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + Supabase (Auth, PostgreSQL, Storage, RLS)**.

- Buscador real (nombre, especialidad, motivo de consulta, provincia, modalidad) con orden por puntuación, A–Z y precio.
- Perfil público por profesional: `/profesionales/<slug>` (ej. `/profesionales/juan-perez`).
- Reserva de turnos persistente, sin dobles reservas (índice único + función en la base).
- Registro de profesionales (queda **pendiente** hasta aprobación), login, logout y recuperación de contraseña con Supabase Auth.
- Panel del profesional `/panel`: dashboard, turnos, horarios, perfil, reseñas.
- Panel de administración `/admin`: verificación, edición, desactivación, turnos y moderación de reseñas.
- Reseñas 1–5 estrellas con moderación; el promedio se recalcula automáticamente.

---

## 1. Requisitos

- **Node.js 18.18 o superior** (recomendado Node 20 LTS) → https://nodejs.org
- **npm** (viene con Node)
- **Visual Studio Code** → https://code.visualstudio.com
- Una cuenta gratuita en **Supabase** → https://supabase.com

Verificá en una terminal:

```bash
node -v
npm -v
```

---

## 2. Instalación

1. Descomprimí `clinvi-app.zip`.
2. En VS Code: **Archivo → Abrir carpeta…** y elegí la carpeta `clinvi-app`.
3. Abrí la terminal integrada: **Terminal → Nueva terminal** (o `Ctrl + ñ` / `Ctrl + \``).
4. Instalá las dependencias:

```bash
npm install
```

Esto genera `node_modules/` y `package-lock.json`.

### Dependencias

| Paquete | Uso |
| --- | --- |
| `next`, `react`, `react-dom` | Framework y UI |
| `@supabase/supabase-js` | Cliente de Supabase |
| `@supabase/ssr` | Sesión de Supabase con cookies (servidor, middleware y navegador) |
| `lucide-react` | Íconos |
| `tailwindcss`, `postcss`, `autoprefixer` | Estilos |
| `typescript`, `@types/*` | Tipado |

---

## 3. Configurar Supabase

### 3.1 Crear el proyecto

1. Entrá a https://supabase.com → **New project**.
2. Elegí nombre, contraseña de base de datos y región (ej. São Paulo).
3. Esperá a que termine de crearse.

### 3.2 Ejecutar el SQL

En Supabase → **SQL Editor** → **New query**:

1. Copiá **todo** el contenido de [`supabase/schema.sql`](supabase/schema.sql), pegalo y presioná **Run**.
   Crea tablas, índices, funciones, triggers, políticas RLS y el bucket `avatars`. Se puede volver a ejecutar sin romper nada.
2. Nueva query con [`supabase/motivos_consulta.sql`](supabase/motivos_consulta.sql) → **Run**.
   Crea la lista maestra de motivos de consulta (58 motivos), la relación profesional ↔ motivo, sus reglas y RLS. Es re-ejecutable y no duplica datos.
   > ¿Ya lo habías ejecutado antes de esta versión? Ejecutá además [`supabase/motivos_preservar_inactivos.sql`](supabase/motivos_preservar_inactivos.sql) (ver [sección 12](#12-motivos-de-consulta)). En una instalación nueva no hace falta.
3. Nueva query con [`supabase/coberturas.sql`](supabase/coberturas.sql) → **Run**.
   Crea la lista maestra de coberturas médicas, la relación profesional ↔ cobertura, sus reglas y RLS. No carga datos.
4. Nueva query con [`supabase/coberturas_import.sql`](supabase/coberturas_import.sql) → **Run**.
   Carga las 78 coberturas del CSV y muestra una fila por registro con la acción aplicada. Ver [sección 14](#14-coberturas-médicas).
5. (Opcional, recomendado para probar) Nueva query con [`supabase/seed.sql`](supabase/seed.sql) → **Run**.
   Carga 8 profesionales demo (una por especialidad) con horarios y reseñas. Quedan marcados con `is_demo = true`.
6. Para borrar los datos demo más adelante: ejecutá [`supabase/reset_demo.sql`](supabase/reset_demo.sql). No toca datos reales.

### 3.3 Obtener las credenciales

Supabase → **Project Settings → API** (o **Connect → App Frameworks**):

- **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL` (ej. `https://abcdefgh.supabase.co`)
- **anon / public key** (o *publishable key*) → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ **Nunca** uses la `service_role` / *secret key* en este proyecto. La app funciona solo con la clave pública y la seguridad la garantiza RLS.

---

## 4. Crear `.env.local`

En la raíz del proyecto hay un `.env.example`. Copialo como `.env.local`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local
# macOS / Linux
cp .env.example .env.local
```

(El ZIP ya incluye un `.env.local` vacío de ejemplo: podés editar ese directamente.)

Completalo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...tu-anon-key...
```

`.env.local` está en `.gitignore`: no se sube a Git. Cada vez que lo cambies, **reiniciá** `npm run dev`.

---

## 5. Configurar la autenticación

Supabase → **Authentication**:

1. **URL Configuration**
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: agregá `http://localhost:3000/auth/callback`
   (Cuando publiques la app, agregá también `https://tu-dominio.com/auth/callback`.)
2. **Sign In / Providers → Email**: habilitado.
3. **Confirm email**:
   - **Para probar rápido** podés desactivarlo: el profesional entra a su panel apenas se registra y puede subir la foto en el mismo paso.
   - **En producción** dejalo activado: el profesional recibe un email, confirma y después ingresa. La ficha pendiente se crea igual (por trigger en la base).

> El servicio de email incluido en Supabase tiene un límite bajo de envíos por hora. Para producción configurá un SMTP propio en **Authentication → Emails → SMTP Settings**.

---

## 6. Crear el primer administrador

1. Creá el usuario:
   - Supabase → **Authentication → Users → Add user → Create new user**, con email y contraseña, marcando **Auto Confirm User**; o
   - registrate desde la app en `/registro` (en ese caso también tendrá ficha profesional).
2. Abrí [`supabase/create_admin.sql`](supabase/create_admin.sql), reemplazá `admin@tudominio.com` por ese email y ejecutalo en el **SQL Editor**.
3. Ingresá en la app con ese usuario: verás **Administración** en el menú (`/admin`).

El rol de administrador **solo** se puede asignar desde SQL (o por otro admin): nadie puede auto-asignárselo desde la app.

---

## 7. Iniciar el proyecto

```bash
npm run dev
```

Abrí http://localhost:3000

Otros comandos:

```bash
npm run build      # compilación de producción (verifica tipos)
npm run start      # servir la compilación
npm run typecheck  # solo chequeo de TypeScript
```

Si no configuraste `.env.local`, la app abre igual y muestra un aviso con los pasos para conectar Supabase (no usa datos falsos).

---

## 8. Cómo probar el sistema

### 8.1 Buscar y reservar (paciente, sin cuenta)

1. En la Home escribí “ansiedad” o tocá una especialidad.
2. En `/buscar` probá filtros (motivo, provincia, modalidad) y el orden.
3. Entrá a un perfil (ej. `/profesionales/juan-perez` si cargaste el seed).
4. En **Reservar turno**: elegí fecha → horario → completá nombre y email (WhatsApp y motivo son opcionales) → **Confirmar reserva**.
5. Verás la confirmación con los datos y un código. El horario desaparece de la lista.
6. Si dos personas intentan el mismo horario, la segunda ve: *“Este horario ya fue reservado. Elegí otro horario.”*

### 8.2 Crear un profesional

1. **Soy profesional** (`/registro`) → completá el formulario → **Crear mi cuenta profesional**.
2. El perfil queda **pendiente** y **no aparece** en el buscador.
3. Ingresá (`/ingresar`) → en `/panel` cargá tus **Horarios** (ej. lunes 09:00, 10:00…) y guardá.
4. Podés ver tu perfil con “Ver mi perfil público” (solo vos lo ves mientras esté pendiente).

### 8.3 Aprobar un profesional

1. Ingresá con el usuario admin → **Administración**.
2. Pestaña **Pendientes** → revisá matrícula y datos → **Aprobar** (o **Rechazar**).
3. El profesional pasa a **activo** y aparece en `/buscar`.
4. Desde **Activos** podés **Editar** o **Desactivar**.

### 8.4 Reseñas

1. En un perfil activo → **Calificar** → estrellas + comentario opcional → enviar.
2. La reseña queda **pendiente**. En **Administración → Reseñas** → **Aprobar**.
3. La puntuación promedio y la cantidad de reseñas del profesional se actualizan solas.

### 8.5 Panel del profesional

- **Dashboard**: turnos de hoy, próximos, horarios semanales, puntuación, link para compartir.
- **Mis turnos**: próximos y pasados; cancelar/reactivar (al cancelar, el horario se libera).
- **Horarios**: activar/desactivar horas por día, agregar horas personalizadas, copiar lunes a días hábiles.
- **Editar perfil**: descripción, precio, WhatsApp, modalidad, habilidades, motivos, foto.

---

## 9. Arquitectura

```
clinvi-app/
├── app/
│   ├── (public)/               # Páginas con header y footer
│   │   ├── page.tsx            # Home
│   │   ├── buscar/             # Buscador
│   │   ├── profesionales/[slug]/  # Perfil público + reserva
│   │   ├── ingresar/ registro/ recuperar/ restablecer/
│   ├── auth/callback/route.ts  # Confirmación de email / recuperación
│   ├── panel/                  # Panel profesional (protegido)
│   ├── admin/                  # Administración (protegido, solo rol admin)
│   ├── layout.tsx  error.tsx  not-found.tsx  icon.svg
├── components/
│   ├── ui/        # Button, Field, Modal, Alert, Badge, Avatar, Stars, Card, Tabs
│   ├── layout/    # Header, HeaderNav, Footer, Logo
│   ├── home/      # Hero, SearchBar, Stats, SpecialtiesGrid, ForProfessionals
│   ├── search/    # SearchFilters, ProfessionalCard
│   ├── profile/   # ProfessionalProfile, WeeklySchedule
│   ├── booking/   # BookingWidget
│   ├── reviews/   # ReviewButton, ReviewsList
│   ├── auth/      # LoginForm, RegisterForm, RecoverForm, ResetPasswordForm, LogoutButton, AuthCard
│   ├── panel/     # PanelSidebar, ScheduleEditor, ProfileEditor, TurnosList, StatCard, ShareLink…
│   ├── coberturas/ # CoberturasSelector (registro y edición de perfil)
│   └── admin/     # AdminNav, AdminProfesionalRow, EstadoActions, ResenaModeration, MotivosAdmin, CoberturasAdmin
├── lib/
│   ├── supabase/  # client.ts (navegador), server.ts (servidor), middleware.ts
│   ├── queries/   # Lecturas del lado servidor (profesionales, panel, admin)
│   ├── actions/   # Mutaciones del lado cliente (auth, profesional, turnos, reseñas)
│   ├── auth.ts  booking.ts  search.ts  validation.ts  errors.ts  constants.ts  utils.ts  config.ts
├── types/index.ts
├── supabase/      # schema.sql, motivos_consulta.sql, coberturas.sql, coberturas_import.sql, verificar_*.sql, seed.sql…
│   └── data/coberturas.csv  # Fuente de la carga inicial de coberturas
├── scripts/       # generar-import-coberturas.mjs
├── tests/         # unit/ (Vitest, sin Supabase) e integration/ (contra un Supabase de prueba)
├── styles/globals.css
├── middleware.ts  # Refresca la sesión y protege /panel y /admin
└── .env.example
```

### Base de datos

| Tabla | Contenido |
| --- | --- |
| `profiles` | 1 fila por usuario de Supabase Auth. `rol`: `profesional` / `admin`. |
| `profesionales` | Ficha pública. `estado`: `pendiente` / `activo` / `rechazado` / `inactivo`. `slug` único. `is_demo` separa los datos demo. |
| `horarios` | Horarios semanales (`dia_semana` 0=domingo…6=sábado, `hora` “HH:MM”). |
| `turnos` | Reservas. Índice único parcial `(profesional_id, fecha, hora)` para turnos confirmados → **no hay dobles reservas**. |
| `resenas` | 1–5 estrellas. `estado`: `pendiente` / `aprobada` / `rechazada`. |

Todas usan UUID, foreign keys, timestamps e índices.

### Seguridad (RLS)

- RLS **activado** en todas las tablas. No hay `service_role` en el frontend. Las contraseñas las gestiona Supabase Auth.
- Público: ve solo profesionales **activos**, sus horarios y reseñas **aprobadas**.
- Reservas: se crean únicamente con la función `reservar_turno` (valida profesional activo, horario existente, fecha futura y duplicados). El público **no puede leer** turnos: solo consulta qué horas están ocupadas con `horarios_ocupados` (sin datos personales).
- Profesionales: editan solo su ficha y sus horarios, y ven solo sus turnos. Un trigger impide que cambien su `estado`, `rating`, `matricula`, `slug` o `user_id`.
- Registro: un trigger en `auth.users` crea el perfil con rol `profesional` y la ficha con estado `pendiente`, sin importar lo que envíe el cliente.
- Administradores (`profiles.rol = 'admin'`): gestionan profesionales, turnos y reseñas.
- Avatares: bucket público de lectura; cada usuario solo puede escribir en su carpeta `avatars/<user_id>/`.

### Decisiones técnicas

- **Lecturas en Server Components** (`lib/queries`) y **mutaciones en el cliente** (`lib/actions`) con la anon key: simple, y la seguridad está en la base (RLS + funciones), no en el código de la UI.
- **Horarios recurrentes semanales** + **turnos por fecha**: la disponibilidad se calcula como “horarios del día − turnos confirmados − horas ya pasadas”.
- **Zona horaria**: la base valida contra `America/Argentina/Buenos_Aires`.
- **Tipos**: definidos a mano en `types/index.ts`. Si querés tipos generados: `npx supabase gen types typescript --project-id <id> > types/supabase.ts`.

---

## 10. Problemas frecuentes

| Síntoma | Solución |
| --- | --- |
| Aviso “Conectá Supabase” | Falta `.env.local` o está incompleto. Reiniciá `npm run dev`. |
| “Database error saving new user” al registrarse | No se ejecutó `supabase/schema.sql` completo. |
| “relation … does not exist” | Ejecutá `supabase/schema.sql`. |
| No aparece un profesional en el buscador | Está `pendiente`: aprobalo desde `/admin`. |
| El link de recuperación lleva a “enlace inválido” | Agregá `http://localhost:3000/auth/callback` en Redirect URLs y abrí el link en el mismo navegador donde lo pediste. |
| “Email not confirmed” | Confirmá el email o desactivá *Confirm email* para pruebas. |
| No se sube la foto | Verificá que exista el bucket `avatars` (lo crea `schema.sql`). |
| No veo “Administración” | Ejecutá `supabase/create_admin.sql` con tu email y volvé a ingresar. |
| “Falta ejecutar supabase/coberturas.sql” | Ejecutá `coberturas.sql` y después `coberturas_import.sql`. |
| El filtro de coberturas aparece vacío | Falta ejecutar `coberturas_import.sql`, o todas están desactivadas en `/admin/coberturas`. |

---

## 11. Publicar (opcional)

1. Subí el proyecto a GitHub (sin `.env.local`).
2. Importalo en https://vercel.com.
3. En Vercel → **Settings → Environment Variables** cargá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. En Supabase → Authentication → URL Configuration: poné tu dominio como Site URL y agregá `https://tu-dominio/auth/callback`.

---

## 12. Motivos de consulta

Lista maestra administrada en Supabase (`motivos_consulta`). Cada motivo pertenece a una especialidad; la unicidad es **especialidad + motivo** (sin distinguir mayúsculas ni acentos), así que "Trastornos alimentarios" puede existir en Psicología y en Nutrición.

### Estructura

| Tabla | Columnas |
| --- | --- |
| `motivos_consulta` | `id`, `especialidad`, `motivo`, `activo`, `notas`, `created_at`, `updated_at` |
| `profesional_motivos` | `profesional_id`, `motivo_id`, `created_at` (PK compuesta) |

Reglas que aplica **la base de datos** (no solo la interfaz):

- Máximo 8 motivos **activos** por profesional (trigger con bloqueo de fila) y mínimo 1 si su especialidad tiene motivos (función `set_profesional_motivos`).
- Solo motivos **activos** de la **misma especialidad** del profesional.
- Si el profesional cambia de especialidad, se eliminan automáticamente los vínculos incompatibles. La interfaz avisa y pide confirmación antes.
- Los motivos no se borran: se desactivan (`activo = false`). Sin policy de DELETE.
- Desactivar un motivo **no borra** los vínculos, ni siquiera cuando el profesional vuelve a guardar su perfil: dejan de mostrarse y de usarse en el buscador, no ocupan lugar en el máximo de 8 y el público no puede leerlos. Al reactivar el motivo, reaparecen solos (igual que las coberturas).
- Caso borde: si al reactivar un motivo un profesional queda con más de 8 activos, su perfil los muestra todos; al volver a guardar, el panel le pide quitar los sobrantes. El bloque E de `verificar_motivos.sql` los lista.
- No se puede cambiar la especialidad de un motivo que ya usan profesionales.
- Los profesionales solo modifican **sus** motivos mediante `set_profesional_motivos` (verifica sesión y dueño/admin). Solo admins crean o editan la lista maestra.
- El público solo lee motivos activos y los vínculos (con motivos activos) de profesionales activos.

**Actualización (migración 004)**: [`supabase/motivos_preservar_inactivos.sql`](supabase/motivos_preservar_inactivos.sql) aplica el comportamiento de conservar vínculos inactivos en una base que ya tenía `motivos_consulta.sql`. Solo reemplaza 2 funciones y 1 política; no toca datos. Los vínculos que la versión anterior haya borrado no se recuperan. El bloque **H** de `verificar_motivos.sql` prueba este comportamiento (crea datos temporales y los revierte).

### Migración de datos existentes

`motivos_consulta.sql` copia los textos viejos de `profesionales.motivos` a la relación cuando coinciden exactamente (sin mayúsculas/acentos) con un motivo de la misma especialidad, hasta 8 por profesional. La columna `profesionales.motivos` **no se borra** y la app ya no la escribe.

Después de ejecutarla, corré los bloques de [`supabase/verificar_motivos.sql`](supabase/verificar_motivos.sql):

- **B** lista los textos que no pudieron mapearse (asignalos a mano desde el panel).
- **C** lista profesionales sin motivos.
- **D, E, F** deben devolver 0 filas.

Cuando confirmes que todo está bien, podés eliminar la columna vieja (opcional):

```sql
alter table public.profesionales drop column motivos;
```

⚠️ Si lo hacés, antes quitá la referencia a `new.motivos` en la función `profesionales_search_text` de `schema.sql`, y los bloques de migración que la usan.

### Dónde se usa

- **Registro** (`/registro`) y **Editar perfil** (`/panel/perfil`, `/admin/profesionales/[id]`): chips seleccionables con contador “X de 8 motivos seleccionados”; al llegar a 8 los demás quedan bloqueados.
- **Buscador** (`/buscar`): el filtro usa el **id** del motivo (`?especialidad=Psicología&motivo=<uuid>`), por lo que nunca mezcla especialidades. Sin especialidad elegida, los motivos se muestran agrupados por especialidad y elegir uno fija su especialidad. Links viejos `?motivo=Ansiedad` pasan a búsqueda por texto.
- **Administración** (`/admin/motivos`): ver, filtrar por especialidad/estado, buscar, agregar, editar texto y notas, activar/desactivar. Los cambios se reflejan sin tocar código.

> Pediatría, Odontología y Dermatología todavía no tienen motivos maestros: sus profesionales pueden guardar el perfil sin motivos. Cargalos desde `/admin/motivos` cuando quieras.

Los motivos son categorías de búsqueda, no diagnósticos.

### Cómo probar

1. Ejecutá `motivos_consulta.sql` (y `seed.sql` si usás datos demo).
2. `/buscar` → Psicología → Más filtros → Motivo “Ansiedad” → aparece Lic. Paula Fernández.
3. Registrate como Nutrición: solo ves motivos de Nutrición. Intentá elegir 9 → queda bloqueado con aviso.
4. En `/panel/perfil` cambiá la especialidad → te pide confirmar la eliminación de motivos incompatibles.
5. Como admin, desactivá “Ansiedad” → desaparece del filtro y del perfil público; reactivalo → vuelve.
6. Agregá un motivo nuevo en `/admin/motivos` → aparece en el registro y el buscador.
7. Re-ejecutá `motivos_consulta.sql` → el bloque A de `verificar_motivos.sql` sigue mostrando 58.

### Antes de hacer deploy en Vercel

- Ejecutar `motivos_consulta.sql` en el proyecto de Supabase de **producción** antes de publicar el código (si no, el buscador y el registro fallan). Si ya estaba ejecutado, ejecutar `motivos_preservar_inactivos.sql`.
- Revisar los bloques B–F de `verificar_motivos.sql` en producción.
- `npm run build` localmente sin errores.
- Confirmar que en Vercel solo están `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nunca la service_role).

---

## 13. Sistema visual ClinVi

Toda la paleta vive en `styles/globals.css` (variables `--clinvi-*`) y se expone en Tailwind (`tailwind.config.ts`):

| Token Tailwind | Uso |
| --- | --- |
| `bg-canvas` / `bg-cream`, `bg-cream-dark` | Fondo general y superficies suaves |
| `forest`, `forest-mid` (y escala `brand-*`) | Primario: botones, títulos, estados activos |
| `terra`, `terra-strong`, `terra-deep`, `terra-light` | Acento: CTA de búsqueda y reserva, alertas cálidas |
| `mist`, `mist-light` | Tercer color de la marca (pétalo derecho) |
| `ink`, `muted`, `soft` | Texto principal, secundario y placeholders |
| `line`, `line-light` | Bordes |
| `danger` | Errores |
| `rounded-clinvi` (10px), `rounded-clinvi-lg` (16px), `rounded-clinvi-xl` (24px) | Radios |
| `shadow-clinvi-sm/md/lg` | Sombras |

Tipografías: **Tinos** (títulos, `font-serif`, peso 400) y **Arimo** (texto, `font-sans`), cargadas con `next/font`. Logo: `public/clinvi-logo.jpg`.

Para cambiar un color de marca, editá la variable en `globals.css`: todos los componentes lo toman de ahí.

---

## 14. Coberturas médicas

Lista maestra administrada en Supabase (`coberturas`): obras sociales nacionales y provinciales, prepagas y la opción “Particular (sin cobertura)”. Es la única fuente para el registro, la edición de perfil, el buscador, el perfil público y el panel admin. Los profesionales **eligen** de la lista; no escriben nombres libres.

### Estructura

| Tabla | Columnas |
| --- | --- |
| `coberturas` | `id`, `tipo`, `nombre`, `sigla`, `provincia`, `activo`, `notas`, `origen` (`csv_inicial` / `admin`), `created_at`, `updated_at` |
| `profesional_coberturas` | `profesional_id`, `cobertura_id`, `created_at` (PK compuesta) |

`tipo`: `obra_social_nacional`, `obra_social_provincial`, `prepaga`, `otra`. `provincia` solo admite las 24 jurisdicciones del sistema (obligatoria para las provinciales).

**Identidad**: nombre (sin mayúsculas ni acentos) + provincia. La sigla **no** es única globalmente: OSEP existe en Catamarca y en Mendoza, IPS en Misiones y en Salta. Sí se impide repetir una sigla dentro de la misma provincia.

Reglas que aplica **la base de datos**:

- Sin límite de coberturas por profesional.
- Solo se vinculan coberturas **existentes y activas** (trigger + función `set_profesional_coberturas`), aunque se manipule la petición.
- Los profesionales solo modifican **sus** coberturas mediante `set_profesional_coberturas` (verifica sesión y dueño/admin). Solo admins crean o editan la lista maestra. Nadie las borra: se desactivan.
- Desactivar una cobertura **no borra** los vínculos: dejan de mostrarse y de usarse en el buscador, y el público no puede leerlos. Si el profesional guarda su perfil, los vínculos con coberturas inactivas se conservan. Al reactivarla, reaparecen solos.
- Registro: **hay que elegir al menos una cobertura** (si atiende sin cobertura, “Particular (sin cobertura)”). Las elegidas se vinculan automáticamente (solo activas). El mínimo lo exige el formulario: la base no bloquea el alta, porque un error en el registro de Supabase Auth se muestra como un error genérico. Si alguien se registrara salteando el formulario, su perfil queda `pendiente` sin coberturas hasta que un admin lo revise.

### Carga inicial del CSV

El archivo fuente es [`supabase/data/coberturas.csv`](supabase/data/coberturas.csv). [`supabase/coberturas_import.sql`](supabase/coberturas_import.sql) se genera a partir de él (ya está generado; no hace falta Node para usarlo):

1. En Supabase → SQL Editor, ejecutá `coberturas.sql` (una vez).
2. Ejecutá `coberturas_import.sql`. Muestra una fila por registro del CSV con la acción:
   - `insertada`: se creó.
   - `ya_existia_igual`: ya estaba, sin cambios.
   - `ya_existia_con_cambios_admin`: ya estaba y fue editada en el panel (por ejemplo, desactivada). **No se modifica.**
   - `conflicto_revisar`: otra cobertura usa la misma sigla en la misma provincia. **No se inserta**; revisalo a mano.
3. Ejecutá [`supabase/verificar_coberturas.sql`](supabase/verificar_coberturas.sql): todas las filas deben decir `OK` (las `INFO` son informativas).

Es seguro re-ejecutar el import: nunca reactiva coberturas desactivadas ni pisa notas editadas. Todo el script corre en una transacción: si algo falla, no queda nada a medias.

Si modificás el CSV, regenerá el SQL con `npm run coberturas:generar-sql` (valida columnas, tipos, provincias y duplicados; si encuentra problemas, no genera nada y los lista).

> `verificar_coberturas.sql` crea usuarios temporales para probar permisos y los revierte al terminar. Si tu proyecto no permite escribir en `auth.users` desde el SQL Editor, verás una fila `ERROR`; la sección de datos sigue siendo válida.

### Dónde se usa

- **Registro** (obligatorio, al menos una) y **Editar perfil** (`/panel/perfil`, `/admin/profesionales/[id]`): chips agrupados por tipo, buscador por nombre, sigla o provincia, resumen de seleccionadas y aviso de cambios sin guardar.
- **Buscador** (`/buscar?cobertura=<uuid>`): filtro por **id** (nunca por texto), independiente de especialidad y motivo, que se combina con Y con los demás filtros. Cambiar la especialidad no borra la cobertura elegida.
- **Perfil público**: sección “Coberturas que acepta”; cada cobertura enlaza al buscador.
- **Administración** (`/admin/coberturas`): buscar, filtrar por tipo, provincia y estado, agregar, editar, activar/desactivar y ver qué profesionales la tienen asociada.

### Cómo probar a mano

1. `/admin/coberturas` → deberías ver 78 coberturas (77 activas; IOSFA inactiva).
2. En `/registro` intentá registrarte sin elegir cobertura → te pide al menos una; elegí “Particular” → continúa.
3. En `/panel/perfil` elegí OSDE, OSEP (Catamarca) y Particular → Guardar → recargá: siguen seleccionadas.
4. `/buscar` → Cobertura “OSEP — Catamarca”: aparece ese profesional; con “OSEP — Mendoza”, no.
5. Como admin desactivá OSDE → desaparece del filtro, del selector y del perfil público. Reactivala → vuelve, con los mismos profesionales.
6. Probá en el celular (o con las herramientas de desarrollo en vista móvil): selector, filtro y perfil.

### Antes de hacer deploy en Vercel

- Ejecutar `coberturas.sql` y `coberturas_import.sql` en el Supabase de **producción** antes de publicar el código.
- Revisar el resultado de `verificar_coberturas.sql` en producción.
- `npm test` y `npm run build` sin errores.

---

## 15. Pruebas automatizadas

Se usa **Vitest 3.2** (compatible con Node 18, 20 y 22). Las pruebas no reemplazan las verificaciones SQL de Supabase (RLS, permisos, integridad): se complementan.

| Comando | Qué hace |
| --- | --- |
| `npm test` | Pruebas unitarias (`tests/unit`). Datos controlados, **sin llamadas a Supabase**. |
| `npm run test:watch` | Igual, pero se re-ejecutan al guardar archivos. |
| `npm run test:integration` | Pruebas de integración (`tests/integration`) contra un Supabase **de prueba**. Sin credenciales, se omiten. |
| `npm run typecheck` | Verificación de tipos de TypeScript. |

**Desde Visual Studio Code**: abrí la terminal integrada (**Terminal → New Terminal**) y ejecutá `npm test`. Para verlas en un panel con botones de “play” por prueba, instalá la extensión oficial **Vitest** (`vitest.explorer`): detecta `vitest.config.mts` automáticamente.

### Qué cubren las unitarias

- Filtrado por especialidad, motivo y cobertura, y sus combinaciones (se exigen **todos** los criterios).
- Motivos con el mismo texto en distintas especialidades y coberturas con la misma sigla en distintas provincias: no se mezclan.
- Motivos y coberturas inactivos, inexistentes o manipulados en la URL: se ignoran.
- Sin profesionales duplicados; profesionales pendientes nunca aparecen.
- Límites de 1 a 8 motivos; al menos una cobertura en el alta (sirve “Particular”; no cuentan inactivas ni ids inventados).
- Orden y límite de 60 resultados.
- Errores (sin detalles técnicos para el usuario) y resultados vacíos.

`tests/unit/helpers/consultaFalsa.ts` reproduce en memoria la semántica de PostgREST que usa el buscador (incluido `!inner`), así que las pruebas ejecutan el código real de `lib/search.ts` y `lib/queries/profesionales.ts`.

### Pruebas de integración (opcional)

Usá **un proyecto de Supabase separado, nunca producción**:

1. En el proyecto de prueba ejecutá `schema.sql`, `motivos_consulta.sql`, `coberturas.sql`, `coberturas_import.sql` y después [`tests/integration/fixture.sql`](tests/integration/fixture.sql).
2. Ejecutá (PowerShell):
   ```powershell
   $env:CLINVI_TEST_SUPABASE_URL="https://<proyecto-de-prueba>.supabase.co"
   $env:CLINVI_TEST_SUPABASE_ANON_KEY="<anon key del proyecto de prueba>"
   npm run test:integration
   ```
   En macOS/Linux: `CLINVI_TEST_SUPABASE_URL=... CLINVI_TEST_SUPABASE_ANON_KEY=... npm run test:integration`
3. Para limpiar los datos de prueba: [`tests/integration/fixture_cleanup.sql`](tests/integration/fixture_cleanup.sql).

Usá siempre la **anon key**: las pruebas verifican lo que puede hacer un visitante, y la `service_role` saltearía las políticas RLS.
