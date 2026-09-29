import CoberturasAdmin from '@/components/admin/CoberturasAdmin';
import PageHeader from '@/components/panel/PageHeader';
import { getSessionInfo } from '@/lib/auth';
import { getAllCoberturasAdmin } from '@/lib/queries/coberturas';

export default async function AdminCoberturasPage() {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const coberturas = await getAllCoberturasAdmin();

  return (
    <div>
      <PageHeader
        title="Coberturas médicas"
        description="Lista maestra de obras sociales, prepagas y atención particular. Las coberturas no se borran: desactivalas para retirarlas del buscador y de los formularios."
      />
      <CoberturasAdmin coberturas={coberturas} />
    </div>
  );
}
