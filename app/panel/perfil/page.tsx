import Link from 'next/link';
import NoProfesional from '@/components/panel/NoProfesional';
import PageHeader from '@/components/panel/PageHeader';
import ProfileEditor from '@/components/panel/ProfileEditor';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { getMotivoIdsDeProfesional, getMotivosActivos } from '@/lib/queries/motivos';

export default async function EditarPerfilPage() {
  const [{ profile }, profesional] = await Promise.all([getSessionInfo(), getMyProfesional()]);
  if (!profesional) return <NoProfesional isAdmin={profile?.rol === 'admin'} />;

  const [motivos, motivoIds] = await Promise.all([getMotivosActivos(), getMotivoIdsDeProfesional(profesional.id)]);

  return (
    <div>
      <PageHeader
        title="Editar perfil"
        description="Estos datos se muestran en tu perfil público."
        action={
          <Link href={`/profesionales/${profesional.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Ver mi perfil público
          </Link>
        }
      />
      <ProfileEditor
        key={`${profesional.updated_at}-${motivoIds.join(',')}`}
        profesional={profesional}
        mode="profesional"
        motivos={motivos}
        motivoIds={motivoIds}
      />
    </div>
  );
}
