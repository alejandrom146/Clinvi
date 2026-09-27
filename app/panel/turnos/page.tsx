import NoProfesional from '@/components/panel/NoProfesional';
import PageHeader from '@/components/panel/PageHeader';
import TurnosList from '@/components/panel/TurnosList';
import Tabs from '@/components/ui/Tabs';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { getTurnosProfesional, type VistaTurnos } from '@/lib/queries/panel';
import type { SearchParamsRecord } from '@/types';

export default async function MisTurnosPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const sp = await searchParams;
  const vista: VistaTurnos = sp.vista === 'pasados' ? 'pasados' : 'proximos';
  const [{ profile }, profesional] = await Promise.all([getSessionInfo(), getMyProfesional()]);
  if (!profesional) return <NoProfesional isAdmin={profile?.rol === 'admin'} />;

  const turnos = await getTurnosProfesional(profesional.id, vista);

  return (
    <div>
      <PageHeader title="Mis turnos" description="Solo vos (y la administración) pueden ver los datos de tus pacientes." />
      <Tabs
        items={[
          { href: '/panel/turnos', label: 'Próximos', active: vista === 'proximos' },
          { href: '/panel/turnos?vista=pasados', label: 'Pasados', active: vista === 'pasados' },
        ]}
      />
      <TurnosList turnos={turnos} emptyText={vista === 'proximos' ? 'No tenés turnos próximos.' : 'No hay turnos pasados.'} />
    </div>
  );
}
