import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import SetupNotice from '@/components/SetupNotice';
import Alert from '@/components/ui/Alert';
import { getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = { title: 'Nueva contraseña' };

export default async function RestablecerPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  const { user } = await getSessionInfo();
  return (
    <AuthCard title="Crear nueva contraseña">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert variant="error">El enlace expiró o no es válido.</Alert>
          <Link href="/recuperar" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
