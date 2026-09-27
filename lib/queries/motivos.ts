import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { MotivoConsulta } from '@/types';

/** Motivos activos (lectura pública, RLS devuelve solo activos a no-admins). */
export const getMotivosActivos = cache(async (): Promise<MotivoConsulta[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('motivos_consulta')
    .select('*')
    .eq('activo', true)
    .order('especialidad')
    .order('motivo');
  if (error) throw new Error(error.message);
  return (data ?? []) as MotivoConsulta[];
});

/** Todos los motivos, incluidos inactivos (solo admin por RLS). */
export async function getAllMotivos(): Promise<MotivoConsulta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('motivos_consulta').select('*').order('especialidad').order('motivo');
  if (error) throw new Error(error.message);
  return (data ?? []) as MotivoConsulta[];
}

/** IDs de motivos ACTIVOS seleccionados por un profesional. */
export async function getMotivoIdsDeProfesional(profesionalId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesional_motivos')
    .select('motivo_id, motivo:motivos_consulta(activo)')
    .eq('profesional_id', profesionalId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as { motivo_id: string; motivo: { activo: boolean } | null }[];
  return rows.filter((r) => r.motivo?.activo).map((r) => r.motivo_id);
}
