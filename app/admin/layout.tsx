import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import SetupNotice from '@/components/SetupNotice';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import { getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import { getContadorResenasPendientes } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Administración', robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  const { user, profile } = await getSessionInfo();
  if (!user) redirect('/ingresar?next=/admin');

  if (profile?.rol !== 'admin') {
    return (
      <div className="px-4 py-16">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={ShieldAlert}
            title="Acceso restringido"
            description="Esta sección es solo para administradores de ClinVi."
            action={
              <Link href="/panel" className={buttonClasses('primary')}>
                Ir a mi panel
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const pendientes = await getContadorResenasPendientes();

  return (
    <div className="min-h-screen">
      <AdminNav resenasPendientes={pendientes} />
      <main className="mx-auto w-full max-w-[1050px] px-4 py-8 sm:px-7 sm:py-9">{children}</main>
    </div>
  );
}
