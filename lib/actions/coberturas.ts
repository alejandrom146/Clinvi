import { createClient } from '@/lib/supabase/client';
import type { CoberturaInput, Profesional } from '@/types';

function traducir(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('COBERTURA_DUPLICADA');
  return new Error(error.message);
}

function datos(input: CoberturaInput) {
  return {
    tipo: input.tipo,
    nombre: input.nombre.trim(),
    sigla: input.sigla.trim() || null,
    provincia: input.provincia.trim() || null,
    notas: input.notas.trim() || null,
  };
}

/** Solo admin: RLS rechaza a cualquier otro usuario. */
export async function crearCobertura(input: CoberturaInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('coberturas').insert({ ...datos(input), activo: true });
  if (error) throw traducir(error);
}

/** Edita los datos sin tocar el id: los vínculos con profesionales se conservan. */
export async function actualizarCobertura(id: string, input: CoberturaInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('coberturas').update(datos(input)).eq('id', id).select('id');
  if (error) throw traducir(error);
  if (!data || data.length === 0) throw new Error('NO_AUTORIZADO');
}

/** No hay borrado físico: retirar una cobertura = activo false. */
export async function cambiarActivoCobertura(id: string, activo: boolean): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from('coberturas').update({ activo }).eq('id', id).select('id');
  if (error) throw traducir(error);
  if (!data || data.length === 0) throw new Error('NO_AUTORIZADO');
}

/** Profesionales asociados a una cobertura (solo admin ve todos, incluidos pendientes). */
export async function listarProfesionalesDeCobertura(coberturaId: string): Promise<Pick<Profesional, 'id' | 'nombre' | 'especialidad' | 'estado'>[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profesionales')
    .select('id, nombre, especialidad, estado, profesional_coberturas!inner(cobertura_id)')
    .eq('profesional_coberturas.cobertura_id', coberturaId)
    .order('nombre');
  if (error) throw traducir(error);
  const rows = (data ?? []) as unknown as (Pick<Profesional, 'id' | 'nombre' | 'especialidad' | 'estado'> & { profesional_coberturas: unknown })[];
  return rows.map(({ profesional_coberturas: _omit, ...p }) => p);
}
