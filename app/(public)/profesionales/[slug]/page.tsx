import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProfessionalProfile from '@/components/profile/ProfessionalProfile';
import SetupNotice from '@/components/SetupNotice';
import { getSessionInfo } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import { getProfesionalBySlug, getResenasAprobadas } from '@/lib/queries/profesionales';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured) return {};
  const p = await getProfesionalBySlug(slug);
  if (!p) return { title: 'Profesional no encontrado' };
  return { title: `${p.nombre} — ${p.especialidad}`, description: p.subtitulo ?? p.bio?.slice(0, 150) ?? undefined };
}

export default async function ProfesionalPage({ params }: Params) {
  const { slug } = await params;
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }

  const profesional = await getProfesionalBySlug(slug);
  if (!profesional) notFound();

  const [resenas, session] = await Promise.all([getResenasAprobadas(profesional.id), getSessionInfo()]);
  const isOwner = Boolean(session.user && session.user.id === profesional.user_id);

  return <ProfessionalProfile profesional={profesional} resenas={resenas} isOwner={isOwner} />;
}
