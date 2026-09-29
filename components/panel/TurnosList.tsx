'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarX2, Mail, MessageCircle } from 'lucide-react';
import Badge, { estadoTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import { cambiarEstadoTurno } from '@/lib/actions/turnos';
import { getErrorMessage } from '@/lib/errors';
import { formatFecha, initials, whatsappLink } from '@/lib/utils';
import type { Turno, TurnoConProfesional } from '@/types';

interface Props {
  turnos: Array<Turno | TurnoConProfesional>;
  showProfesional?: boolean;
  emptyText?: string;
}

function agrupar(turnos: Props['turnos']) {
  const map = new Map<string, Props['turnos']>();
  for (const t of turnos) {
    const list = map.get(t.fecha) ?? [];
    list.push(t);
    map.set(t.fecha, list);
  }
  return Array.from(map.entries());
}

export default function TurnosList({ turnos, showProfesional = false, emptyText = 'No hay turnos para mostrar.' }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(t: Turno) {
    const nuevo = t.estado === 'confirmado' ? 'cancelado' : 'confirmado';
    if (nuevo === 'cancelado' && !window.confirm(`¿Cancelar el turno de ${t.pac_nombre}? El horario vuelve a quedar disponible.`)) return;
    setError(null);
    setLoadingId(t.id);
    try {
      await cambiarEstadoTurno(t.id, nuevo);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingId(null);
    }
  }

  if (turnos.length === 0) return <EmptyState icon={CalendarX2} title={emptyText} />;

  return (
    <div className="space-y-6">
      {error && <p className="rounded-[9px] border border-terra/30 bg-terra/[0.08] px-4 py-3 text-sm text-danger">{error}</p>}
      {agrupar(turnos).map(([fecha, lista]) => (
        <section key={fecha}>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{formatFecha(fecha)}</h3>
          <ul className="divide-y divide-line-light overflow-hidden rounded-clinvi-lg border border-line-light bg-white px-4 shadow-clinvi-sm sm:px-6">
            {lista.map((t) => {
              const wa = whatsappLink(t.pac_whatsapp);
              const prof = 'profesional' in t ? t.profesional : null;
              return (
                <li key={t.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:gap-3.5">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-cream-dark font-serif text-sm font-normal text-forest" aria-hidden="true">
                      {initials(t.pac_nombre)}
                    </span>
                    <span className="font-serif text-xl font-normal text-forest sm:hidden">{t.hora}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{t.pac_nombre}</span>
                      <span className="hidden text-[13px] text-muted sm:inline">· {t.hora} h</span>
                      <Badge tone={estadoTone(t.estado)}>{t.estado === 'confirmado' ? 'Confirmado' : 'Cancelado'}</Badge>
                    </div>
                    {showProfesional && prof && (
                      <Link href={`/profesionales/${prof.slug}`} className="text-xs font-medium text-forest hover:text-forest-mid hover:underline">
                        con {prof.nombre}
                      </Link>
                    )}
                    {t.pac_motivo && <p className="mt-1 text-sm text-muted">{t.pac_motivo}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <a href={`mailto:${t.pac_email}`} className="inline-flex items-center gap-1 text-muted hover:text-forest">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.pac_email}
                      </a>
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-forest">
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          {t.pac_whatsapp}
                        </a>
                      )}
                    </div>
                  </div>
                  <Button variant={t.estado === 'confirmado' ? 'outline' : 'secondary'} size="sm" loading={loadingId === t.id} onClick={() => toggle(t)}>
                    {t.estado === 'confirmado' ? 'Cancelar' : 'Reactivar'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
