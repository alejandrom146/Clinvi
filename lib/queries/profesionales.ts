import { cache } from 'react';
import { isSupabaseConfigured } from '@/lib/config';
import { ESPECIALIDADES } from '@/lib/constants';
import { ordenarCoberturas } from '@/lib/coberturas';
import { aplicarFiltros, columnasBusqueda, LIMITE_RESULTADOS, sinDuplicados, type ConsultaBusqueda } from '@/lib/search';
import { createClient } from '@/lib/supabase/server';
import type { Cobertura, FiltrosBusqueda, MotivoConsulta, Profesional, ProfesionalConDetalle, ProfesionalConHorarios, Resena } from '@/types';

/**
 * `f.motivo` y `f.cobertura` deben venir validados con resolverFiltros() (ids de
 * elementos activos). Ambos identifican un registro único de la lista maestra:
 * un mismo texto en dos especialidades, o una sigla compartida entre provincias,
 * nunca se mezclan. Todos los filtros se combinan con Y.
 */
export async function searchProfesionales(f: FiltrosBusqueda): Promise<Profesional[]> {
  const supabase = await createClient();
  const base = supabase.from('profesionales').select(columnasBusqueda(f)) as unknown as ConsultaBusqueda;
  const query = aplicarFiltros(base, f);
  const { data, error } = await query.limit(LIMITE_RESULTADOS);
  if (error) {
    // El detalle técnico queda en el log del servidor; al usuario se le muestra un mensaje claro.
    console.error('searchProfesionales', error);
    throw new Error('BUSQUEDA_FALLIDA');
  }
  return sinDuplicados((data ?? []) as unknown as Profesional[]);
}

type PerfilRow = ProfesionalConHorarios & {
  profesional_motivos?: { motivo: MotivoConsulta | null }[];
  profesional_coberturas?: { cobertura: Cobertura | null }[];
};

/**
 * Perfil por slug con horarios, motivos y coberturas activos.
 * RLS devuelve solo perfiles activos (o el propio / admin) y oculta al público las coberturas inactivas.
 */
export const getProfesionalBySlug = cache(async (slug: string): Promise<ProfesionalConDetalle | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesionales')
    .select('*, horarios(*), profesional_motivos(motivo:motivos_consulta(*)), profesional_coberturas(cobertura:coberturas(*))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as unknown as PerfilRow | null;
  if (!row) return null;
  const { profesional_motivos, profesional_coberturas, ...rest } = row;
  const motivosConsulta = (profesional_motivos ?? [])
    .map((x) => x.motivo)
    .filter((m): m is MotivoConsulta => Boolean(m && m.activo))
    .sort((a, b) => a.motivo.localeCompare(b.motivo, 'es'));
  const coberturas = ordenarCoberturas(
    (profesional_coberturas ?? []).map((x) => x.cobertura).filter((c): c is Cobertura => Boolean(c && c.activo)),
  );
  return { ...rest, motivosConsulta, coberturas };
});

export async function getResenasAprobadas(profesionalId: string, limit = 30): Promise<Resena[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resenas')
    .select('*')
    .eq('profesional_id', profesionalId)
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Resena[];
}

export interface HomeStats {
  activos: number | null;
  especialidades: number;
}

export async function getHomeStats(): Promise<HomeStats> {
  const especialidades = ESPECIALIDADES.length;
  if (!isSupabaseConfigured) return { activos: null, especialidades };
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('profesionales')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activo');
    if (error) return { activos: null, especialidades };
    return { activos: count ?? 0, especialidades };
  } catch {
    return { activos: null, especialidades };
  }
}
