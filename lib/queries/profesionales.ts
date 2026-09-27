import { cache } from 'react';
import { isSupabaseConfigured } from '@/lib/config';
import { ESPECIALIDADES } from '@/lib/constants';
import { searchTerms } from '@/lib/search';
import { createClient } from '@/lib/supabase/server';
import type { FiltrosBusqueda, MotivoConsulta, Profesional, ProfesionalConDetalle, ProfesionalConHorarios, Resena } from '@/types';

/**
 * `f.motivo` debe venir ya validado con resolverFiltros() (id de un motivo activo,
 * compatible con la especialidad). El id identifica especialidad + motivo, así que
 * un mismo texto en dos especialidades nunca se mezcla.
 */
export async function searchProfesionales(f: FiltrosBusqueda): Promise<Profesional[]> {
  const supabase = await createClient();
  const columns: string = f.motivo ? '*, profesional_motivos!inner(motivo_id)' : '*';
  let query = supabase.from('profesionales').select(columns).eq('estado', 'activo');

  if (f.motivo) query = query.eq('profesional_motivos.motivo_id', f.motivo);
  if (f.especialidad) query = query.eq('especialidad', f.especialidad);
  if (f.provincia) query = query.eq('provincia', f.provincia);
  if (f.modalidad === 'virtual') query = query.in('modalidad', ['virtual', 'ambas']);
  if (f.modalidad === 'presencial') query = query.in('modalidad', ['presencial', 'ambas']);
  if (f.modalidad === 'ambas') query = query.eq('modalidad', 'ambas');
  for (const term of searchTerms(f.q)) {
    query = query.ilike('search_text', `%${term}%`);
  }

  if (f.orden === 'az') query = query.order('nombre', { ascending: true });
  else if (f.orden === 'precio') query = query.order('precio', { ascending: true, nullsFirst: false });
  else query = query.order('rating', { ascending: false }).order('resenas_count', { ascending: false });

  const { data, error } = await query.limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Profesional[];
}

type PerfilRow = ProfesionalConHorarios & { profesional_motivos?: { motivo: MotivoConsulta | null }[] };

/** Perfil por slug con horarios y motivos activos. RLS devuelve solo activos (o el propio / admin). */
export const getProfesionalBySlug = cache(async (slug: string): Promise<ProfesionalConDetalle | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesionales')
    .select('*, horarios(*), profesional_motivos(motivo:motivos_consulta(*))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as unknown as PerfilRow | null;
  if (!row) return null;
  const { profesional_motivos, ...rest } = row;
  const motivosConsulta = (profesional_motivos ?? [])
    .map((x) => x.motivo)
    .filter((m): m is MotivoConsulta => Boolean(m && m.activo))
    .sort((a, b) => a.motivo.localeCompare(b.motivo, 'es'));
  return { ...rest, motivosConsulta };
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
