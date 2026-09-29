import { cache } from 'react';
import { coberturasActivas } from '@/lib/coberturas';
import { createClient } from '@/lib/supabase/server';
import type { Cobertura, CoberturaAdmin } from '@/types';

/**
 * Coberturas activas (lectura pública; RLS devuelve solo activas a no-admins).
 * Una sola consulta por request: los filtros por tipo o provincia se resuelven
 * en memoria con coberturasPorTipo() / coberturasPorProvincia() de lib/coberturas.
 */
export const getCoberturasActivas = cache(async (): Promise<Cobertura[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('coberturas').select('*').eq('activo', true);
  if (error) throw new Error(error.message);
  return coberturasActivas((data ?? []) as Cobertura[]);
});

/** Todas las coberturas, incluidas inactivas, con cantidad de profesionales asociados (solo admin por RLS). */
export async function getAllCoberturasAdmin(): Promise<CoberturaAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('coberturas').select('*, profesional_coberturas(count)');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as (Cobertura & { profesional_coberturas: { count: number }[] | null })[];
  return rows.map(({ profesional_coberturas, ...c }) => ({ ...c, profesionales_count: profesional_coberturas?.[0]?.count ?? 0 }));
}

/** IDs de coberturas ACTIVAS asociadas a un profesional (las inactivas se conservan, pero no se editan). */
export async function getCoberturaIdsDeProfesional(profesionalId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profesional_coberturas')
    .select('cobertura_id, cobertura:coberturas(activo)')
    .eq('profesional_id', profesionalId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as { cobertura_id: string; cobertura: { activo: boolean } | null }[];
  return rows.filter((r) => r.cobertura?.activo).map((r) => r.cobertura_id);
}
