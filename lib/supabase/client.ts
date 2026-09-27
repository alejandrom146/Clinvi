import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/config';

/** Cliente de Supabase para componentes de cliente. Usa solo la anon key (RLS protege los datos). */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no configurado: completá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reiniciá npm run dev.',
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
