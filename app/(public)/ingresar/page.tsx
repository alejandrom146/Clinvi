import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import LoginForm from '@/components/auth/LoginForm';
import SetupNotice from '@/components/SetupNotice';
import Alert from '@/components/ui/Alert';
import { getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import { safeNext } from '@/lib/utils';
import type { SearchParamsRecord } from '@/types';

export const metadata: Metadata = { title: 'Ingresar' };

export default async function IngresarPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  const sp = await searchParams;
  const nextParam = typeof sp.next === 'string' ? sp.next : undefined;
  const { user } = await getSessionInfo();
  if (user) redirect(safeNext(nextParam));

  return (
    <AuthCard title="Bienvenido/a" description="Ingresá para acceder a tu panel profesional">
      {sp.error === 'enlace' && (
        <Alert variant="error" className="mb-4">
          El enlace expiró o no es válido. Volvé a intentarlo.
        </Alert>
      )}
      <LoginForm next={nextParam ? safeNext(nextParam) : undefined} />
    </AuthCard>
  );
}
