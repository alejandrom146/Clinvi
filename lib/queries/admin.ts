import { createClient } from '@/lib/supabase/server';
import { todayISO } from '@/lib/utils';
import type { EstadoResena, ProfesionalAdmin, ResenaConProfesional, TurnoConProfesional } from '@/types';
import type { VistaTurnos } from '@/lib/queries/panel';

export async function getAllProfesionales(): Promise<ProfesionalAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesionales')
    .select('*, profile:profiles(email)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfesionalAdmin[];
}

export async function getProfesionalById(id: string): Promise<ProfesionalAdmin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesionales')
    .select('*, profile:profiles(email)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfesionalAdmin | null) ?? null;
}

export async function getAllTurnos(vista: VistaTurnos = 'proximos'): Promise<TurnoConProfesional[]> {
  const supabase = await createClient();
  const hoy = todayISO();
  let query = supabase.from('turnos').select('*, profesional:profesionales(nombre, slug)');
  query =
    vista === 'proximos'
      ? query.gte('fecha', hoy).order('fecha', { ascending: true }).order('hora', { ascending: true })
      : query.lt('fecha', hoy).order('fecha', { ascending: false }).order('hora', { ascending: false });
  const { data, error } = await query.limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as TurnoConProfesional[];
}

export async function getResenasPorEstado(estado: EstadoResena): Promise<ResenaConProfesional[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resenas')
    .select('*, profesional:profesionales(nombre, slug)')
    .eq('estado', estado)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as ResenaConProfesional[];
}

export async function getContadorResenasPendientes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('resenas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente');
  return count ?? 0;
}
