// Las variables NEXT_PUBLIC_* deben referenciarse literalmente para que Next.js las incluya en el cliente.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

export const TIMEZONE = 'America/Argentina/Buenos_Aires';
