import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/panel/PageHeader';
import ProfileEditor from '@/components/panel/ProfileEditor';
import { getSessionInfo } from '@/lib/auth';
import { getProfesionalById } from '@/lib/queries/admin';
import { getCoberturaIdsDeProfesional, getCoberturasActivas } from '@/lib/queries/coberturas';
import { getMotivoIdsDeProfesional, getMotivosActivos } from '@/lib/queries/motivos';

export default async function AdminEditarProfesional({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const profesional = await getProfesionalById(id);
  if (!profesional) notFound();

  const [motivos, motivoIds, coberturas, coberturaIds] = await Promise.all([
    getMotivosActivos(),
    getMotivoIdsDeProfesional(profesional.id),
    getCoberturasActivas(),
    getCoberturaIdsDeProfesional(profesional.id),
  ]);

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </Link>
      <PageHeader
        title={`Editar: ${profesional.nombre}`}
        description={profesional.profile?.email ?? undefined}
        action={
          <Link href={`/profesionales/${profesional.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Ver perfil
          </Link>
        }
      />
      <ProfileEditor
        key={`${profesional.updated_at}-${motivoIds.join(',')}-${coberturaIds.join(',')}`}
        profesional={profesional}
        mode="admin"
        motivos={motivos}
        motivoIds={motivoIds}
        coberturas={coberturas}
        coberturaIds={coberturaIds}
      />
    </div>
  );
}
