import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, BadgeCheck, CalendarCheck, FileBadge, MapPin, MessageCircle } from 'lucide-react';
import BookingWidget from '@/components/booking/BookingWidget';
import ReviewButton from '@/components/reviews/ReviewButton';
import ReviewsList from '@/components/reviews/ReviewsList';
import Alert from '@/components/ui/Alert';
import Avatar from '@/components/ui/Avatar';
import { buttonClasses } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import Stars from '@/components/ui/Stars';
import { ESTADO_PROFESIONAL_LABEL, modalidadLabel } from '@/lib/constants';
import { filtrosToQuery } from '@/lib/search';
import { formatPrecio, whatsappLink } from '@/lib/utils';
import WeeklySchedule from './WeeklySchedule';
import type { ProfesionalConDetalle, Resena } from '@/types';

interface Props {
  profesional: ProfesionalConDetalle;
  resenas: Resena[];
  isOwner: boolean;
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function ProfessionalProfile({ profesional: p, resenas, isOwner }: Props) {
  const wa = whatsappLink(p.whatsapp, `Hola ${p.nombre}, te escribo desde ClinVi.`);

  return (
    <>
      <div className="border-b border-line-light bg-gradient-to-b from-cream to-white">
        <div className="mx-auto max-w-[1000px] px-4 pt-4 sm:px-7">
          <Link href="/buscar" className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-forest/80 hover:text-forest">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a resultados
          </Link>
          {isOwner && (
            <Alert variant="info" className="mt-2">
              Estás viendo tu perfil tal como lo ven los pacientes.{' '}
              <Link href="/panel" className="font-semibold underline">
                Volver a mi panel
              </Link>
              {p.estado !== 'activo' && <> · Estado actual: <strong>{ESTADO_PROFESIONAL_LABEL[p.estado]}</strong> (no visible públicamente).</>}
            </Alert>
          )}
          <div className="flex flex-col gap-5 pb-7 pt-6 sm:flex-row sm:items-start sm:gap-7">
            <Avatar nombre={p.nombre} src={p.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[30px] font-bold leading-tight">{p.nombre}</h1>
              <p className="mt-1 text-[15px] text-muted">{p.subtitulo || p.especialidad}</p>
              {p.provincia && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] text-muted">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.provincia}
                </p>
              )}
              <div className="mt-2">
                <Stars value={p.rating} count={p.resenas_count} size="lg" />
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {p.estado === 'activo' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest/[0.08] px-3.5 py-[5px] text-[13px] font-semibold text-forest">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verificado
                  </span>
                )}
                <span className="rounded-full border-[1.5px] border-line bg-cream px-3.5 py-[5px] text-[13px] font-medium text-muted">{p.especialidad}</span>
                <span className="rounded-full border-[1.5px] border-line bg-cream px-3.5 py-[5px] text-[13px] font-medium text-muted">{modalidadLabel(p.modalidad)}</span>
                {p.matricula && (
                  <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-cream px-3.5 py-[5px] text-[13px] font-medium text-muted">
                    <FileBadge className="h-3.5 w-3.5" aria-hidden="true" />
                    Mat. {p.matricula}
                  </span>
                )}
              </div>
              <a href="#reservar" className={buttonClasses('accent', 'md', 'mt-5 text-white hover:text-white lg:hidden')}>
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Reservar turno
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1000px] gap-6 px-4 py-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-[18px]">
          {p.bio && (
            <Section title="Sobre mí">
              <p className="whitespace-pre-line text-[15px] leading-[1.75] text-muted">{p.bio}</p>
            </Section>
          )}

          {p.habilidades.length > 0 && (
            <Section title="Experiencia y habilidades">
              <div className="flex flex-wrap gap-2">
                {p.habilidades.map((h) => (
                  <span key={h} className="rounded-full border border-line bg-cream px-3.5 py-1.5 text-[13px] font-medium text-forest">
                    {h}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {p.motivosConsulta.length > 0 && (
            <Section title="Motivos de consulta">
              <div className="flex flex-wrap gap-2">
                {p.motivosConsulta.map((m) => (
                  <Link
                    key={m.id}
                    href={`/buscar${filtrosToQuery({ especialidad: m.especialidad, motivo: m.id })}`}
                    className="rounded-full border-[1.5px] border-line bg-white px-4 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-terra hover:text-terra-deep"
                  >
                    {m.motivo}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title="Horarios de atención">
            <WeeklySchedule horarios={p.horarios} />
          </Section>

          <Section
            title={`Reseñas${p.resenas_count > 0 ? ` (${p.resenas_count})` : ''}`}
            action={p.estado === 'activo' ? <ReviewButton profesionalId={p.id} nombreProfesional={p.nombre} /> : undefined}
          >
            <ReviewsList resenas={resenas} />
          </Section>
        </div>

        <aside id="reservar" className="scroll-mt-24">
          <div className="rounded-clinvi-lg border-[1.5px] border-line bg-white p-5 shadow-clinvi-md sm:p-6 lg:sticky lg:top-20">
            <p className="font-serif text-[30px] font-bold leading-none text-ink">
              {formatPrecio(p.precio)}
              {p.precio !== null && <small className="ml-1 font-sans text-sm font-normal text-muted">/ consulta</small>}
            </p>
            <hr className="my-4 border-line-light" />
            <BookingWidget profesionalId={p.id} nombreProfesional={p.nombre} estado={p.estado} horarios={p.horarios} />
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-clinvi bg-[#1E8E4A] text-sm font-semibold text-white transition-colors hover:bg-[#187A3F] hover:text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
