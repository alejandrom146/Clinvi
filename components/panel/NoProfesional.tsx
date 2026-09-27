import Link from 'next/link';
import { UserX } from 'lucide-react';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';

export default function NoProfesional({ isAdmin }: { isAdmin: boolean }) {
  return (
    <EmptyState
      icon={UserX}
      title="Tu cuenta no tiene un perfil profesional"
      description={
        isAdmin
          ? 'Sos administrador/a. Gestioná profesionales, turnos y reseñas desde el panel de administración.'
          : 'Registrate como profesional para cargar tu perfil y recibir turnos.'
      }
      action={
        <Link href={isAdmin ? '/admin' : '/registro'} className={buttonClasses('primary')}>
          {isAdmin ? 'Ir a administración' : 'Registrarme como profesional'}
        </Link>
      }
    />
  );
}
