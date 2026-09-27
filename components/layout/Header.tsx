import { getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import HeaderNav from './HeaderNav';

export default async function Header() {
  const { user, profile } = await getSessionInfo();
  return (
    <>
      {!isSupabaseConfigured && (
        <div className="flex items-center justify-center gap-2.5 border-b border-line bg-cream-dark px-4 py-2.5 text-center text-[13px] text-muted">
          <span className="h-[9px] w-[9px] shrink-0 animate-pulse rounded-full bg-[#FFC107]" aria-hidden="true" />
          <span>
            Supabase no está configurado. Completá <code>.env.local</code> (ver README.md) para usar la aplicación con datos reales.
          </span>
        </div>
      )}
      <HeaderNav isLoggedIn={Boolean(user)} isAdmin={profile?.rol === 'admin'} />
    </>
  );
}
