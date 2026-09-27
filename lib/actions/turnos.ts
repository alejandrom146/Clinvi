import { createClient } from '@/lib/supabase/client';
import type { EstadoTurno, ReservaInput } from '@/types';

export async function fetchOcupados(profesionalId: string, fecha: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('horarios_ocupados', {
    p_profesional_id: profesionalId,
    p_fecha: fecha,
  });
  if (error) throw error;
  return ((data ?? []) as { hora: string }[]).map((r) => r.hora);
}

/** Reserva vía RPC reservar_turno (valida horario, fecha y duplicados en la base). */
export async function reservarTurno(input: ReservaInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('reservar_turno', {
    p_profesional_id: input.profesionalId,
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_nombre: input.nombre.trim(),
    p_email: input.email.trim(),
    p_whatsapp: input.whatsapp?.trim() || null,
    p_motivo: input.motivo?.trim() || null,
  });
  if (error) throw error;
  return data as string;
}

export async function cambiarEstadoTurno(id: string, estado: EstadoTurno): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('turnos').update({ estado }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No tenés permisos para modificar este turno.');
}
