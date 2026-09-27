import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import RecoverForm from '@/components/auth/RecoverForm';
import SetupNotice from '@/components/SetupNotice';
import { isSupabaseConfigured } from '@/lib/config';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function RecuperarPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }
  return (
    <AuthCard title="Recuperar contraseña" description="Te enviamos un enlace para crear una contraseña nueva.">
      <RecoverForm />
    </AuthCard>
  );
}
