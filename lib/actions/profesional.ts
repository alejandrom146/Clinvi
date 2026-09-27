import { createClient } from '@/lib/supabase/client';
import { horarioKey } from '@/lib/booking';
import { MAX_MOTIVOS } from '@/lib/constants';
import type { EstadoProfesional, Horario, PerfilEditable } from '@/types';

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

async function updateProfesional(id: string, values: Record<string, unknown>): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('profesionales').update(values).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No tenés permisos para modificar este perfil.');
}

export async function actualizarPerfil(id: string, perfil: PerfilEditable): Promise<void> {
  await updateProfesional(id, { ...perfil });
}

export async function actualizarAvatar(profesionalId: string, userId: string, file: File): Promise<string> {
  const url = await uploadAvatar(userId, file);
  await updateProfesional(profesionalId, { avatar_url: url });
  return url;
}

/** Solo admin (RLS + trigger lo garantizan). */
export async function cambiarEstadoProfesional(id: string, estado: EstadoProfesional): Promise<void> {
  await updateProfesional(id, { estado });
}

/**
 * Reemplaza los motivos del profesional vía RPC. La base verifica sesión,
 * dueño/admin, especialidad, motivos activos y el límite 1..8.
 */
export async function guardarMotivos(profesionalId: string, motivoIds: string[]): Promise<void> {
  const ids = Array.from(new Set(motivoIds));
  if (ids.length > MAX_MOTIVOS) throw new Error('MOTIVOS_MAXIMO');
  const supabase = createClient();
  const { error } = await supabase.rpc('set_profesional_motivos', {
    p_profesional_id: profesionalId,
    p_motivo_ids: ids,
  });
  if (error) throw error;
}

/** Sincroniza los horarios semanales: borra los quitados e inserta los nuevos. */
export async function guardarHorarios(profesionalId: string, actuales: Horario[], seleccion: Set<string>): Promise<void> {
  const supabase = createClient();
  const existentes = new Set(actuales.map((h) => horarioKey(h.dia_semana, h.hora)));

  const aBorrar = actuales.filter((h) => !seleccion.has(horarioKey(h.dia_semana, h.hora))).map((h) => h.id);
  const aCrear = Array.from(seleccion)
    .filter((k) => !existentes.has(k))
    .map((k) => {
      const [dia, hora] = k.split('|');
      return { profesional_id: profesionalId, dia_semana: Number(dia), hora };
    });

  if (aBorrar.length > 0) {
    const { error } = await supabase.from('horarios').delete().in('id', aBorrar);
    if (error) throw error;
  }
  if (aCrear.length > 0) {
    const { error } = await supabase.from('horarios').insert(aCrear);
    if (error) throw error;
  }
}
