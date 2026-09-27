import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

/** Cliente de Supabase para Server Components, Route Handlers y Server Actions. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any) {
  try {
    cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options));
  } catch {
    // Manejo de errores
  }
}
    },
  });
}
