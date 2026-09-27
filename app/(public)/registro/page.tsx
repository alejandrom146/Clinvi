import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';
import SetupNotice from '@/components/SetupNotice';
import { isSupabaseConfigured } from '@/lib/config';
import { getMotivosActivos } from '@/lib/queries/motivos';

export const metadata: Metadata = { title: 'Registro de profesional' };

export default async function RegistroPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  const motivos = await getMotivosActivos();
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-7 sm:py-12">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-terra-strong">Para profesionales</p>
        <h1 className="text-[30px] font-bold leading-tight">Registro de profesional</h1>
        <p className="mt-1.5 max-w-[540px] text-sm leading-relaxed text-muted">
          Completá tus datos. Verificamos tu matrícula manualmente antes de activar tu perfil.
        </p>
      </div>
      <RegisterForm motivos={motivos} />
    </div>
  );
}
