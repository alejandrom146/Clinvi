import NoProfesional from '@/components/panel/NoProfesional';
import PageHeader from '@/components/panel/PageHeader';
import ScheduleEditor from '@/components/panel/ScheduleEditor';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { getHorariosProfesional } from '@/lib/queries/panel';

export default async function HorariosPage() {
  const [{ profile }, profesional] = await Promise.all([getSessionInfo(), getMyProfesional()]);
  if (!profesional) return <NoProfesional isAdmin={profile?.rol === 'admin'} />;

  const horarios = await getHorariosProfesional(profesional.id);
  const key = horarios.map((h) => h.id).join(',');

  return (
    <div>
      <PageHeader
        title="Horarios"
        description="Definí tus horarios semanales. Los pacientes verán solo los que estén libres; los reservados desaparecen automáticamente."
      />
      <ScheduleEditor key={key} profesionalId={profesional.id} horarios={horarios} />
    </div>
  );
}
