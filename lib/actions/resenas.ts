import { createClient } from '@/lib/supabase/client';
import type { EstadoResena } from '@/types';

export interface NuevaResena {
  profesionalId: string;
  puntuacion: number;
  nombre: string;
  comentario: string;
}

/** Crea una reseña en estado "pendiente" (queda a la espera de moderación). */
export async function crearResena(r: NuevaResena): Promise<void> {
  if (!Number.isInteger(r.puntuacion) || r.puntuacion < 1 || r.puntuacion > 5) {
    throw new Error('Elegí una puntuación de 1 a 5 estrellas.');
  }
  const supabase = createClient();
  const { error } = await supabase.from('resenas').insert({
    profesional_id: r.profesionalId,
    puntuacion: r.puntuacion,
    nombre: r.nombre.trim() || null,
    comentario: r.comentario.trim() || null,
    estado: 'pendiente',
  });
  if (error) throw error;
}

export async function moderarResena(id: string, estado: EstadoResena): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('resenas').update({ estado }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No tenés permisos para moderar reseñas.');
}

export async function eliminarResena(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('resenas').delete().eq('id', id);
  if (error) throw error;
}
