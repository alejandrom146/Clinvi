import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';
import type { Profesional, Profile } from '@/types';

export interface SessionInfo {
  user: User | null;
  profile: Profile | null;
}

/** Usuario actual + perfil (rol). Cacheado por request. */
export const getSessionInfo = cache(async (): Promise<SessionInfo> => {
  if (!isSupabaseConfigured) return { user: null, profile: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { user, profile: (data as Profile | null) ?? null };
});

/** Ficha profesional del usuario logueado (o null si no tiene). */
export const getMyProfesional = cache(async (): Promise<Profesional | null> => {
  const { user } = await getSessionInfo();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('profesionales').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Profesional | null) ?? null;
});
