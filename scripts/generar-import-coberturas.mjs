#!/usr/bin/env node
/**
 * Genera supabase/coberturas_import.sql a partir de supabase/data/coberturas.csv.
 *
 * Uso:  npm run coberturas:generar-sql
 *
 * Valida el CSV antes de generar nada (columnas, tipos, "activo", provincias,
 * duplicados). Si encuentra problemas, los lista y NO genera el SQL.
 * El SQL resultante es seguro de re-ejecutar: solo inserta lo que falta y
 * nunca modifica coberturas existentes (ver comentarios en el archivo generado).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = resolve(root, 'supabase/data/coberturas.csv');
const OUT = resolve(root, 'supabase/coberturas_import.sql');

const COLUMNAS = ['tipo', 'nombre', 'sigla', 'provincia', 'activo', 'notas'];
const TIPOS = ['obra_social_nacional', 'obra_social_provincial', 'prepaga', 'otra'];
const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa',
  'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

/** Parser CSV (RFC 4180): comillas, comas y saltos de línea dentro de campos. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const sql = (v) => (v === null ? 'null' : `'${v.replace(/'/g, "''")}'`);

const raw = readFileSync(CSV, 'utf8').replace(/^\uFEFF/, ''); // quita BOM
const [header, ...data] = parseCsv(raw);
const problemas = [];

const cols = header.map((h) => h.trim());
if (cols.join(',') !== COLUMNAS.join(',')) problemas.push(`Columnas inesperadas: ${cols.join(', ')}`);

const filas = data.map((r, i) => {
  const fila = i + 2; // número de línea en el archivo (1 = encabezado)
  if (r.length !== COLUMNAS.length) problemas.push(`Fila ${fila}: ${r.length} columnas (se esperaban ${COLUMNAS.length}).`);
  const v = Object.fromEntries(COLUMNAS.map((c, j) => [c, (r[j] ?? '').trim()]));
  if (!TIPOS.includes(v.tipo)) problemas.push(`Fila ${fila}: tipo inválido "${v.tipo}".`);
  if (v.nombre.length < 2) problemas.push(`Fila ${fila}: nombre vacío.`);
  if (!['true', 'false'].includes(v.activo.toLowerCase())) problemas.push(`Fila ${fila}: activo inválido "${v.activo}".`);
  if (v.provincia && !PROVINCIAS.includes(v.provincia)) problemas.push(`Fila ${fila}: provincia desconocida "${v.provincia}".`);
  if (v.tipo === 'obra_social_provincial' && !v.provincia) problemas.push(`Fila ${fila}: obra social provincial sin provincia.`);
  return {
    fila,
    tipo: v.tipo,
    nombre: v.nombre.replace(/\s+/g, ' '),
    sigla: v.sigla || null,
    provincia: v.provincia || null,
    activo: v.activo.toLowerCase() === 'true',
    notas: v.notas || null,
  };
});

const vistos = new Map();
const siglas = new Map();
for (const f of filas) {
  const k = `${norm(f.nombre)}|${f.provincia ?? ''}`;
  if (vistos.has(k)) problemas.push(`Filas ${vistos.get(k)} y ${f.fila}: misma cobertura (nombre + provincia).`);
  vistos.set(k, f.fila);
  if (f.sigla) {
    const s = `${norm(f.sigla)}|${f.provincia ?? ''}`;
    if (siglas.has(s)) problemas.push(`Filas ${siglas.get(s)} y ${f.fila}: sigla repetida en la misma provincia.`);
    siglas.set(s, f.fila);
  }
}

if (problemas.length > 0) {
  console.error(`El CSV tiene ${problemas.length} problema(s). No se generó el SQL:\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}

const porTipo = Object.fromEntries(TIPOS.map((t) => [t, filas.filter((f) => f.tipo === t).length]));
const values = filas
  .map((f) => `  (${f.fila}, ${sql(f.tipo)}, ${sql(f.nombre)}, ${sql(f.sigla)}, ${sql(f.provincia)}, ${f.activo}, ${sql(f.notas)})`)
  .join(',\n');

const out = `-- =====================================================================
-- ClinVi — Carga inicial de coberturas (GENERADO, no editar a mano)
-- Origen: supabase/data/coberturas.csv (${filas.length} filas)
--   obra_social_nacional: ${porTipo.obra_social_nacional} · obra_social_provincial: ${porTipo.obra_social_provincial}
--   prepaga: ${porTipo.prepaga} · otra: ${porTipo.otra}
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
${values};

-- Verificación de integridad del lote (aborta toda la carga si no coincide).
do $$
declare
  v_total int;
begin
  select count(*) into v_total from _coberturas_csv;
  if v_total <> ${filas.length} then
    raise exception 'IMPORTACION_ABORTADA: se esperaban ${filas.length} filas y hay %', v_total;
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
`;

writeFileSync(OUT, out);
console.log(`OK: ${filas.length} filas válidas → ${OUT.replace(root + '/', '')}`);
console.log(porTipo);
