import { createClient } from '@/lib/supabase/client';
import type { MotivoInput } from '@/types';

function traducir(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('MOTIVO_DUPLICADO');
  return new Error(error.message);
}

/** Solo admin: RLS rechaza a cualquier otro usuario. */
export async function crearMotivo(input: MotivoInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('motivos_consulta').insert({
    especialidad: input.especialidad.trim(),
    motivo: input.motivo.trim(),
    notas: input.notas.trim() || null,
    activo: true,
  });
  if (error) throw traducir(error);
}

export async function actualizarMotivo(id: string, cambios: { motivo: string; notas: string }): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('motivos_consulta')
    .update({ motivo: cambios.motivo.trim(), notas: cambios.notas.trim() || null })
    .eq('id', id)
    .select('id');
  if (error) throw traducir(error);
  if (!data || data.length === 0) throw new Error('NO_AUTORIZADO');
}

/** No hay borrado físico: retirar un motivo = activo false. */
export async function cambiarActivoMotivo(id: string, activo: boolean): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('motivos_consulta').update({ activo }).eq('id', id).select('id');
  if (error) throw traducir(error);
  if (!data || data.length === 0) throw new Error('NO_AUTORIZADO');
}
