import NoProfesional from '@/components/panel/NoProfesional';
import PageHeader from '@/components/panel/PageHeader';
import ReviewsList from '@/components/reviews/ReviewsList';
import { Card } from '@/components/ui/Card';
import Stars from '@/components/ui/Stars';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { getResenasAprobadas } from '@/lib/queries/profesionales';

export default async function ResenasPanelPage() {
  const [{ profile }, profesional] = await Promise.all([getSessionInfo(), getMyProfesional()]);
  if (!profesional) return <NoProfesional isAdmin={profile?.rol === 'admin'} />;

  const resenas = await getResenasAprobadas(profesional.id, 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Reseñas" description="Las reseñas se publican luego de ser moderadas por ClinVi. La puntuación se calcula con las aprobadas." />
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <span className="text-4xl font-bold text-ink">{profesional.rating > 0 ? Number(profesional.rating).toFixed(1) : '—'}</span>
        <div>
          <Stars value={profesional.rating} showValue={false} size="lg" />
          <p className="mt-1 text-sm text-muted">
            {profesional.resenas_count} reseña{profesional.resenas_count === 1 ? '' : 's'} aprobada{profesional.resenas_count === 1 ? '' : 's'}
          </p>
        </div>
      </Card>
      <ReviewsList resenas={resenas} />
    </div>
  );
}
