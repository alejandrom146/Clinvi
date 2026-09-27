import PageHeader from '@/components/panel/PageHeader';
import TurnosList from '@/components/panel/TurnosList';
import Tabs from '@/components/ui/Tabs';
import { getSessionInfo } from '@/lib/auth';
import { getAllTurnos } from '@/lib/queries/admin';
import type { VistaTurnos } from '@/lib/queries/panel';
import type { SearchParamsRecord } from '@/types';

export default async function AdminTurnosPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const sp = await searchParams;
  const vista: VistaTurnos = sp.vista === 'pasados' ? 'pasados' : 'proximos';
  const turnos = await getAllTurnos(vista);

  return (
    <div>
      <PageHeader title="Turnos" description="Todos los turnos reservados en la plataforma." />
      <Tabs
        items={[
          { href: '/admin/turnos', label: 'Próximos', active: vista === 'proximos' },
          { href: '/admin/turnos?vista=pasados', label: 'Pasados', active: vista === 'pasados' },
        ]}
      />
      <TurnosList turnos={turnos} showProfesional emptyText={vista === 'proximos' ? 'No hay turnos próximos.' : 'No hay turnos pasados.'} />
    </div>
  );
}
