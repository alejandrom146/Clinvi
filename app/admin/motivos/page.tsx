import MotivosAdmin from '@/components/admin/MotivosAdmin';
import PageHeader from '@/components/panel/PageHeader';
import { getSessionInfo } from '@/lib/auth';
import { getAllMotivos } from '@/lib/queries/motivos';

export default async function AdminMotivosPage() {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const motivos = await getAllMotivos();

  return (
    <div>
      <PageHeader
        title="Motivos de consulta"
        description="Lista maestra por especialidad. Los motivos no se borran: desactivalos para retirarlos del buscador y de los formularios."
      />
      <MotivosAdmin motivos={motivos} />
    </div>
  );
}
