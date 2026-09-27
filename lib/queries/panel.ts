import { createClient } from '@/lib/supabase/server';
import { todayISO } from '@/lib/utils';
import type { Horario, Turno } from '@/types';

export type VistaTurnos = 'proximos' | 'pasados';

export async function getTurnosProfesional(profesionalId: string, vista: VistaTurnos = 'proximos'): Promise<Turno[]> {
  const supabase = await createClient();
  const hoy = todayISO();
  let query = supabase.from('turnos').select('*').eq('profesional_id', profesionalId);
  query =
    vista === 'proximos'
      ? query.gte('fecha', hoy).order('fecha', { ascending: true }).order('hora', { ascending: true })
      : query.lt('fecha', hoy).order('fecha', { ascending: false }).order('hora', { ascending: false });
  const { data, error } = await query.limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Turno[];
}

export async function getHorariosProfesional(profesionalId: string): Promise<Horario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('horarios')
    .select('*')
    .eq('profesional_id', profesionalId)
    .order('dia_semana')
    .order('hora');
  if (error) throw new Error(error.message);
  return (data ?? []) as Horario[];
}
