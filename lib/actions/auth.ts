import { createClient } from '@/lib/supabase/client';
import { uploadAvatar } from '@/lib/actions/profesional';
import type { RegistroInput } from '@/types';

export async function login(email: string, password: string): Promise<{ esAdmin: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', data.user.id).maybeSingle();
  return { esAdmin: (perfil as { rol: string } | null)?.rol === 'admin' };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export interface RegistroResultado {
  requiereConfirmacion: boolean;
  avatarSubido: boolean;
}

/**
 * Registra al profesional en Supabase Auth. El trigger handle_new_user crea
 * automáticamente su perfil con estado "pendiente" a partir de los metadatos.
 */
export async function registrarProfesional(input: RegistroInput, avatar: File | null): Promise<RegistroResultado> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/panel`,
      data: {
        tipo: 'profesional',
        nombre: input.nombre.trim(),
        especialidad: input.especialidad,
        subtitulo: input.subtitulo.trim(),
        matricula: input.matricula.trim(),
        provincia: input.provincia,
        bio: input.bio.trim(),
        habilidades: input.habilidades,
        motivo_ids: input.motivoIds,
        modalidad: input.modalidad,
        precio: input.precio === null ? '' : String(input.precio),
        whatsapp: input.whatsapp.trim(),
      },
    },
  });
  if (error) throw error;
  // Con confirmación de email activa, Supabase devuelve un usuario sin identidades si el email ya existe.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('User already registered');
  }

  let avatarSubido = false;
  if (data.session && data.user && avatar) {
    try {
      const url = await uploadAvatar(data.user.id, avatar);
      const { error: updError } = await supabase
        .from('profesionales')
        .update({ avatar_url: url })
        .eq('user_id', data.user.id);
      avatarSubido = !updError;
    } catch {
      avatarSubido = false;
    }
  }

  return { requiereConfirmacion: !data.session, avatarSubido };
}

export async function solicitarRecuperacion(email: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
  });
  if (error) throw error;
}

export async function actualizarPassword(password: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
