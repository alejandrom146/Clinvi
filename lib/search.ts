import { MODALIDAD_VALUES } from '@/lib/constants';
import { normalizar } from '@/lib/utils';
import type { Cobertura, FiltrosBusqueda, Modalidad, MotivoConsulta, SearchParamsRecord } from '@/types';

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Máximo de resultados que devuelve el buscador (comportamiento existente). */
export const LIMITE_RESULTADOS = 60;

export const FILTROS_VACIOS: FiltrosBusqueda = {
  q: '',
  especialidad: '',
  provincia: '',
  modalidad: '',
  motivo: '',
  cobertura: '',
  orden: 'rating',
};

export function parseFiltros(sp: SearchParamsRecord): FiltrosBusqueda {
  const modalidad = first(sp.modalidad);
  const orden = first(sp.orden);
  const motivoRaw = first(sp.motivo).trim();
  const motivoEsId = UUID.test(motivoRaw);
  const coberturaRaw = first(sp.cobertura).trim();
  return {
    // Compatibilidad: links viejos ?motivo=Ansiedad (texto) se convierten en búsqueda por texto.
    q: (first(sp.q) || (motivoEsId ? '' : motivoRaw)).slice(0, 100),
    especialidad: first(sp.especialidad),
    provincia: first(sp.provincia),
    motivo: motivoEsId ? motivoRaw.toLowerCase() : '',
    // La cobertura se identifica SOLO por id: un texto (ej. "OSEP") nunca se usa como filtro.
    cobertura: UUID.test(coberturaRaw) ? coberturaRaw.toLowerCase() : '',
    modalidad: MODALIDAD_VALUES.includes(modalidad as Modalidad) ? (modalidad as Modalidad) : '',
    orden: orden === 'az' || orden === 'precio' ? orden : 'rating',
  };
}

export interface FiltrosResueltos {
  filtros: FiltrosBusqueda;
  motivo: MotivoConsulta | null;
  cobertura: Cobertura | null;
}

/**
 * Valida motivo y cobertura contra las listas ACTIVAS:
 * - un motivo inexistente, inactivo o de otra especialidad se ignora;
 * - si no hay especialidad elegida, se toma la del motivo;
 * - una cobertura inexistente o inactiva se ignora (no depende de la especialidad).
 */
export function resolverFiltros(f: FiltrosBusqueda, motivosActivos: MotivoConsulta[], coberturasActivas: Cobertura[] = []): FiltrosResueltos {
  let filtros: FiltrosBusqueda = { ...f };
  let motivo: MotivoConsulta | null = null;
  let cobertura: Cobertura | null = null;

  if (filtros.motivo) {
    const m = motivosActivos.find((x) => x.id === filtros.motivo && x.activo);
    if (!m || (filtros.especialidad && filtros.especialidad !== m.especialidad)) {
      filtros = { ...filtros, motivo: '' };
    } else {
      filtros = { ...filtros, especialidad: m.especialidad };
      motivo = m;
    }
  }

  if (filtros.cobertura) {
    const c = coberturasActivas.find((x) => x.id === filtros.cobertura && x.activo);
    if (!c) filtros = { ...filtros, cobertura: '' };
    else cobertura = c;
  }

  return { filtros, motivo, cobertura };
}

/**
 * Nuevo estado de filtros cuando el usuario cambia uno (usado por SearchFilters).
 * - Cambiar la especialidad limpia el motivo si deja de corresponder.
 * - Elegir un motivo fija su especialidad.
 * - La cobertura es independiente: nunca se limpia por cambiar especialidad o motivo.
 */
export function cambiarFiltro<K extends keyof FiltrosBusqueda>(
  actual: FiltrosBusqueda,
  key: K,
  value: FiltrosBusqueda[K],
  motivos: MotivoConsulta[],
): FiltrosBusqueda {
  const next: FiltrosBusqueda = { ...actual, [key]: value };
  if (key === 'especialidad' && next.motivo) {
    const m = motivos.find((x) => x.id === next.motivo);
    if (!m || m.especialidad !== value) next.motivo = '';
  }
  if (key === 'motivo' && value) {
    const m = motivos.find((x) => x.id === value);
    if (m) next.especialidad = m.especialidad;
  }
  return next;
}

export function filtrosToQuery(f: Partial<FiltrosBusqueda>): string {
  const params = new URLSearchParams();
  if (f.q?.trim()) params.set('q', f.q.trim());
  if (f.especialidad) params.set('especialidad', f.especialidad);
  if (f.motivo) params.set('motivo', f.motivo);
  if (f.cobertura) params.set('cobertura', f.cobertura);
  if (f.provincia) params.set('provincia', f.provincia);
  if (f.modalidad) params.set('modalidad', f.modalidad);
  if (f.orden && f.orden !== 'rating') params.set('orden', f.orden);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Palabras de búsqueda normalizadas y seguras para usar en ILIKE. */
export function searchTerms(q: string): string[] {
  return normalizar(q)
    .replace(/[%_*,()\\]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 5);
}

/**
 * Columnas del select. Cada filtro relacional agrega un join INNER (`!inner`):
 * PostgREST devuelve cada profesional UNA sola vez aunque tenga varias filas
 * en la relación, y solo si existe una fila que cumple el filtro.
 */
export function columnasBusqueda(f: Pick<FiltrosBusqueda, 'motivo' | 'cobertura'>): string {
  const cols = ['*'];
  if (f.motivo) cols.push('profesional_motivos!inner(motivo_id)');
  if (f.cobertura) cols.push('profesional_coberturas!inner(cobertura_id)');
  return cols.join(', ');
}

/** Subconjunto de la API de filtros de Supabase que usa el buscador. */
export interface ConsultaFiltrable<Q> {
  eq(column: string, value: string): Q;
  in(column: string, values: readonly string[]): Q;
  ilike(column: string, pattern: string): Q;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): Q;
}

/**
 * Aplica TODOS los filtros (se combinan con Y): un profesional aparece solo si
 * cumple cada criterio elegido. `f` debe venir validado con resolverFiltros().
 * Motivo y cobertura se comparan por id, nunca por texto.
 */
export function aplicarFiltros<Q extends ConsultaFiltrable<Q>>(query: Q, f: FiltrosBusqueda): Q {
  let q = query.eq('estado', 'activo');
  if (f.motivo) q = q.eq('profesional_motivos.motivo_id', f.motivo);
  if (f.cobertura) q = q.eq('profesional_coberturas.cobertura_id', f.cobertura);
  if (f.especialidad) q = q.eq('especialidad', f.especialidad);
  if (f.provincia) q = q.eq('provincia', f.provincia);
  if (f.modalidad === 'virtual') q = q.in('modalidad', ['virtual', 'ambas']);
  if (f.modalidad === 'presencial') q = q.in('modalidad', ['presencial', 'ambas']);
  if (f.modalidad === 'ambas') q = q.eq('modalidad', 'ambas');
  for (const term of searchTerms(f.q)) {
    q = q.ilike('search_text', `%${term}%`);
  }

  if (f.orden === 'az') q = q.order('nombre', { ascending: true });
  else if (f.orden === 'precio') q = q.order('precio', { ascending: true, nullsFirst: false });
  else q = q.order('rating', { ascending: false }).order('resenas_count', { ascending: false });
  return q;
}

/**
 * Tipo de la consulta del buscador. El cliente de Supabase sin esquema generado
 * tiene tipos genéricos demasiado profundos para que TypeScript los compare con
 * ConsultaFiltrable (error TS2589), así que la consulta se tipa con esta interfaz,
 * que describe exactamente los métodos que se usan.
 */
export interface ConsultaBusqueda extends ConsultaFiltrable<ConsultaBusqueda> {
  limit(count: number): PromiseLike<{ data: unknown[] | null; error: { message: string; code?: string } | null }>;
}

/** Quita duplicados por id conservando el orden (defensa extra ante joins muchos a muchos). */
export function sinDuplicados<T extends { id: string }>(lista: T[]): T[] {
  const vistos = new Set<string>();
  return lista.filter((x) => (vistos.has(x.id) ? false : (vistos.add(x.id), true)));
}
