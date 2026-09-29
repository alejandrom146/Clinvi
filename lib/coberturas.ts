import { TIPOS_COBERTURA } from '@/lib/constants';
import { normalizar } from '@/lib/utils';
import type { Cobertura, TipoCobertura } from '@/types';

type CoberturaBase = Pick<Cobertura, 'id' | 'tipo' | 'nombre' | 'sigla' | 'provincia' | 'activo'>;

export function tipoCoberturaLabel(tipo: TipoCobertura): string {
  return TIPOS_COBERTURA.find((t) => t.value === tipo)?.label ?? tipo;
}

/** Sigla solo si aporta información (OSDE → "OSDE", no "OSDE (OSDE)"). */
export function siglaVisible(c: Pick<Cobertura, 'nombre' | 'sigla'>): string | null {
  if (!c.sigla) return null;
  const s = normalizar(c.sigla.trim());
  const n = normalizar(c.nombre);
  if (s === n || n.includes(`(${s})`)) return null;
  return c.sigla;
}

/** Texto corto para chips y resúmenes: sigla si existe, si no el nombre. Incluye la provincia de las provinciales. */
export function etiquetaCorta(c: CoberturaBase): string {
  const base = c.sigla ?? c.nombre;
  return c.tipo === 'obra_social_provincial' && c.provincia ? `${base} · ${c.provincia}` : base;
}

/** Texto completo, sin ambigüedad entre coberturas con la misma sigla (ej. OSEP Catamarca / OSEP Mendoza). */
export function etiquetaCompleta(c: CoberturaBase): string {
  const sigla = siglaVisible(c);
  const partes = [sigla ? `${c.nombre} (${sigla})` : c.nombre];
  if (c.provincia) partes.push(c.provincia);
  return partes.join(' — ');
}

/** Solo coberturas activas, ordenadas por tipo y luego alfabéticamente (provinciales por provincia). */
export function coberturasActivas<T extends CoberturaBase>(lista: T[]): T[] {
  return ordenarCoberturas(lista.filter((c) => c.activo));
}

export function ordenarCoberturas<T extends CoberturaBase>(lista: T[]): T[] {
  const orden = (t: TipoCobertura) => TIPOS_COBERTURA.findIndex((x) => x.value === t);
  return [...lista].sort(
    (a, b) =>
      orden(a.tipo) - orden(b.tipo) ||
      (a.tipo === 'obra_social_provincial' ? (a.provincia ?? '').localeCompare(b.provincia ?? '', 'es') : 0) ||
      (a.sigla ?? a.nombre).localeCompare(b.sigla ?? b.nombre, 'es'),
  );
}

export function coberturasPorTipo<T extends CoberturaBase>(lista: T[], tipo: TipoCobertura): T[] {
  return lista.filter((c) => c.tipo === tipo);
}

/** Coberturas asociadas a una provincia (las nacionales y prepagas sin provincia no se incluyen). */
export function coberturasPorProvincia<T extends CoberturaBase>(lista: T[], provincia: string): T[] {
  return lista.filter((c) => c.provincia === provincia);
}

/** Búsqueda por nombre, sigla o provincia, sin distinguir mayúsculas ni acentos. */
export function buscarCoberturas<T extends CoberturaBase>(lista: T[], texto: string): T[] {
  const terminos = normalizar(texto).split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return lista;
  return lista.filter((c) => {
    const campo = normalizar([c.nombre, c.sigla ?? '', c.provincia ?? ''].join(' '));
    return terminos.every((t) => campo.includes(t));
  });
}

/** Agrupa por tipo, en el orden de TIPOS_COBERTURA, omitiendo grupos vacíos. */
export function agruparPorTipo<T extends CoberturaBase>(lista: T[]): { tipo: TipoCobertura; label: string; coberturas: T[] }[] {
  const ordenadas = ordenarCoberturas(lista);
  return TIPOS_COBERTURA.map((t) => ({ tipo: t.value, label: t.plural, coberturas: ordenadas.filter((c) => c.tipo === t.value) })).filter(
    (g) => g.coberturas.length > 0,
  );
}

/**
 * Normaliza una selección antes de guardarla: quita duplicados y descarta ids
 * que no correspondan a una cobertura activa. La base vuelve a validarlo.
 */
export function seleccionValida(ids: string[], activas: CoberturaBase[]): string[] {
  const disponibles = new Set(activas.filter((c) => c.activo).map((c) => c.id));
  return Array.from(new Set(ids)).filter((id) => disponibles.has(id));
}

/** true si dos selecciones tienen los mismos ids (sin importar el orden). */
export function mismaSeleccion(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && Array.from(sa).every((x) => sb.has(x));
}

/**
 * Detecta un duplicado accidental antes de enviarlo a la base (que igual lo impide):
 * mismo nombre + provincia, o misma sigla + provincia.
 */
export function coberturaDuplicada(
  lista: Pick<Cobertura, 'id' | 'nombre' | 'sigla' | 'provincia'>[],
  datos: { nombre: string; sigla: string; provincia: string },
  exceptoId?: string,
): boolean {
  const n = normalizar(datos.nombre.trim().replace(/\s+/g, ' '));
  const s = normalizar(datos.sigla.trim());
  const p = datos.provincia.trim();
  return lista.some(
    (c) =>
      c.id !== exceptoId &&
      (c.provincia ?? '') === p &&
      (normalizar(c.nombre) === n || (s !== '' && c.sigla !== null && normalizar(c.sigla) === s)),
  );
}

/** Validación del formulario admin (la base vuelve a validar con CHECK y RLS). Devuelve el primer error o null. */
export function validarCobertura(
  input: { tipo: string; nombre: string; sigla: string; provincia: string; notas: string },
  provinciasValidas: readonly string[],
  tiposValidos: readonly string[],
): string | null {
  if (!tiposValidos.includes(input.tipo)) return 'Elegí el tipo de cobertura.';
  const nombre = input.nombre.trim();
  if (nombre.length < 2) return 'Escribí el nombre completo (mínimo 2 caracteres).';
  if (nombre.length > 160) return 'El nombre no puede superar los 160 caracteres.';
  if (input.sigla.trim().length > 40) return 'La sigla no puede superar los 40 caracteres.';
  if (input.provincia && !provinciasValidas.includes(input.provincia)) return 'Elegí una provincia de la lista.';
  if (input.tipo === 'obra_social_provincial' && !input.provincia) return 'Las obras sociales provinciales necesitan una provincia.';
  if (input.notas.trim().length > 500) return 'Las notas no pueden superar los 500 caracteres.';
  return null;
}
