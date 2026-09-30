import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import PanelSidebar from '@/components/panel/PanelSidebar';
import SetupNotice from '@/components/SetupNotice';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = { title: 'Mi panel', robots: { index: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  const { user, profile } = await getSessionInfo();
  if (!user) redirect('/ingresar?next=/panel');
  // Las cuentas de administración no usan el panel profesional: su panel es /admin.
  if (profile?.rol === 'admin') redirect('/admin');
  const profesional = await getMyProfesional();

  return (
    <div className="min-h-screen lg:flex">
      <PanelSidebar nombre={profesional?.nombre ?? profile?.nombre ?? user.email ?? null} slug={profesional?.slug ?? null} isAdmin={false} />
      <main className="min-w-0 flex-1 bg-cream px-4 py-6 sm:px-9 sm:py-9">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
