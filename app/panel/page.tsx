import Link from 'next/link';
import { CalendarDays, CalendarRange, Clock, Star } from 'lucide-react';
import NoProfesional from '@/components/panel/NoProfesional';
import PageHeader from '@/components/panel/PageHeader';
import ShareLink from '@/components/panel/ShareLink';
import StatCard from '@/components/panel/StatCard';
import TurnosList from '@/components/panel/TurnosList';
import Alert from '@/components/ui/Alert';
import { getMyProfesional, getSessionInfo } from '@/lib/auth';
import { getHorariosProfesional, getTurnosProfesional } from '@/lib/queries/panel';
import { todayISO } from '@/lib/utils';

const ESTADO_MSG = {
  pendiente: { variant: 'warning' as const, title: 'Tu perfil está en revisión', text: 'Un administrador está verificando tu matrícula. Mientras tanto podés completar tu perfil y tus horarios.' },
  rechazado: { variant: 'error' as const, title: 'Tu perfil fue rechazado', text: 'Revisá tus datos (especialmente la matrícula) y contactá a ClinVi para una nueva revisión.' },
  inactivo: { variant: 'warning' as const, title: 'Tu perfil está desactivado', text: 'No aparece en el buscador ni recibe reservas. Contactá a ClinVi para reactivarlo.' },
};

export default async function PanelDashboard() {
  const [{ profile }, profesional] = await Promise.all([getSessionInfo(), getMyProfesional()]);
  if (!profesional) return <NoProfesional isAdmin={profile?.rol === 'admin'} />;

  const [turnos, horarios] = await Promise.all([getTurnosProfesional(profesional.id, 'proximos'), getHorariosProfesional(profesional.id)]);
  const confirmados = turnos.filter((t) => t.estado === 'confirmado');
  const hoy = todayISO();
  const deHoy = confirmados.filter((t) => t.fecha === hoy);
  const proximos = confirmados.filter((t) => t.fecha > hoy);
  const estadoMsg = profesional.estado !== 'activo' ? ESTADO_MSG[profesional.estado] : null;

  return (
    <div className="space-y-8">
      <PageHeader title={`Hola, ${profesional.nombre.split(' ').slice(0, 2).join(' ')}`} description="Este es el resumen de tu consultorio virtual." />

      {estadoMsg && (
        <Alert variant={estadoMsg.variant} title={estadoMsg.title}>
          {estadoMsg.text}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Turnos hoy" value={String(deHoy.length)} icon={CalendarDays} />
        <StatCard label="Próximos turnos" value={String(proximos.length)} icon={CalendarRange} />
        <StatCard label="Horarios disponibles" value={String(horarios.length)} icon={Clock} hint="por semana" />
        <StatCard
          label="Puntuación"
          value={profesional.rating > 0 ? Number(profesional.rating).toFixed(1) : '—'}
          icon={Star}
          hint={`${profesional.resenas_count} reseña${profesional.resenas_count === 1 ? '' : 's'}`}
        />
      </div>

      {horarios.length === 0 && (
        <Alert variant="info" title="Todavía no cargaste horarios">
          Los pacientes solo pueden reservar en los horarios que definas.{' '}
          <Link href="/panel/horarios" className="font-semibold underline">
            Cargar horarios
          </Link>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Turnos de hoy</h2>
            <Link href="/panel/turnos" className="text-sm font-semibold text-brand-700 hover:underline">
              Ver todos
            </Link>
          </div>
          <TurnosList turnos={deHoy} emptyText="No tenés turnos para hoy." />
          {proximos.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-lg font-bold text-ink">Próximos turnos</h2>
              <TurnosList turnos={proximos.slice(0, 5)} />
            </>
          )}
        </section>
        <div className="space-y-4">
          <ShareLink slug={profesional.slug} />
        </div>
      </div>
    </div>
  );
}
