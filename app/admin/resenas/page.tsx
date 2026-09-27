import ResenaModeration from '@/components/admin/ResenaModeration';
import PageHeader from '@/components/panel/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { getSessionInfo } from '@/lib/auth';
import { getResenasPorEstado } from '@/lib/queries/admin';
import type { EstadoResena, SearchParamsRecord } from '@/types';

const ESTADOS: { key: EstadoResena; label: string }[] = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobada', label: 'Aprobadas' },
  { key: 'rechazada', label: 'Rechazadas' },
];

export default async function AdminResenasPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const sp = await searchParams;
  const estado: EstadoResena = sp.estado === 'aprobada' || sp.estado === 'rechazada' ? sp.estado : 'pendiente';
  const resenas = await getResenasPorEstado(estado);

  return (
    <div>
      <PageHeader title="Reseñas" description="Solo las reseñas aprobadas se publican y cuentan para la puntuación." />
      <Tabs
        items={ESTADOS.map((e) => ({
          href: e.key === 'pendiente' ? '/admin/resenas' : `/admin/resenas?estado=${e.key}`,
          label: e.label,
          active: estado === e.key,
        }))}
      />
      <ResenaModeration resenas={resenas} />
    </div>
  );
}
