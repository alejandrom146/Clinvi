import { UserCheck } from 'lucide-react';
import AdminProfesionalRow from '@/components/admin/AdminProfesionalRow';
import PageHeader from '@/components/panel/PageHeader';
import { EmptyState } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { getSessionInfo } from '@/lib/auth';
import { getAllProfesionales } from '@/lib/queries/admin';
import type { EstadoProfesional, SearchParamsRecord } from '@/types';

const VISTAS: { key: EstadoProfesional | 'otros'; label: string; href: string }[] = [
  { key: 'pendiente', label: 'Pendientes', href: '/admin' },
  { key: 'activo', label: 'Activos', href: '/admin?vista=activo' },
  { key: 'otros', label: 'Rechazados e inactivos', href: '/admin?vista=otros' },
];

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const { profile } = await getSessionInfo();
  if (profile?.rol !== 'admin') return null;

  const sp = await searchParams;
  const vista = sp.vista === 'activo' || sp.vista === 'otros' ? sp.vista : 'pendiente';
  const todos = await getAllProfesionales();

  const filtrar = (k: string) =>
    todos.filter((p) => (k === 'otros' ? p.estado === 'rechazado' || p.estado === 'inactivo' : p.estado === k));
  const lista = filtrar(vista);

  return (
    <div>
      <PageHeader title="Administración" description="Verificación manual de profesionales" />
      <Tabs items={VISTAS.map((v) => ({ href: v.href, label: v.label, active: vista === v.key, count: filtrar(v.key).length }))} />
      {lista.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={vista === 'pendiente' ? 'No hay solicitudes pendientes de verificación' : 'No hay profesionales en esta categoría'}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm">
          {lista.map((p) => (
            <AdminProfesionalRow key={p.id} profesional={p} detallado={vista === 'pendiente'} />
          ))}
        </ul>
      )}
    </div>
  );
}
