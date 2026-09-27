import { MODALIDAD_VALUES } from '@/lib/constants';
import { normalizar } from '@/lib/utils';
import type { FiltrosBusqueda, Modalidad, MotivoConsulta, SearchParamsRecord } from '@/types';

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseFiltros(sp: SearchParamsRecord): FiltrosBusqueda {
  const modalidad = first(sp.modalidad);
  const orden = first(sp.orden);
  const motivoRaw = first(sp.motivo).trim();
  const motivoEsId = UUID.test(motivoRaw);
  return {
    // Compatibilidad: links viejos ?motivo=Ansiedad (texto) se convierten en búsqueda por texto.
    q: (first(sp.q) || (motivoEsId ? '' : motivoRaw)).slice(0, 100),
    especialidad: first(sp.especialidad),
    provincia: first(sp.provincia),
    motivo: motivoEsId ? motivoRaw.toLowerCase() : '',
    modalidad: MODALIDAD_VALUES.includes(modalidad as Modalidad) ? (modalidad as Modalidad) : '',
    orden: orden === 'az' || orden === 'precio' ? orden : 'rating',
  };
}

/**
 * Valida el motivo contra la lista de motivos ACTIVOS:
 * - si no existe o está inactivo, se ignora;
 * - si no pertenece a la especialidad elegida, se ignora;
 * - si no hay especialidad elegida, se toma la del motivo.
 */
export function resolverFiltros(f: FiltrosBusqueda, motivosActivos: MotivoConsulta[]): { filtros: FiltrosBusqueda; motivo: MotivoConsulta | null } {
  if (!f.motivo) return { filtros: f, motivo: null };
  const m = motivosActivos.find((x) => x.id === f.motivo && x.activo);
  if (!m || (f.especialidad && f.especialidad !== m.especialidad)) {
    return { filtros: { ...f, motivo: '' }, motivo: null };
  }
  return { filtros: { ...f, especialidad: m.especialidad }, motivo: m };
}

export function filtrosToQuery(f: Partial<FiltrosBusqueda>): string {
  const params = new URLSearchParams();
  if (f.q?.trim()) params.set('q', f.q.trim());
  if (f.especialidad) params.set('especialidad', f.especialidad);
  if (f.motivo) params.set('motivo', f.motivo);
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
