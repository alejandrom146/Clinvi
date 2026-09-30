import Link from 'next/link';
import { Pencil } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge, { estadoTone } from '@/components/ui/Badge';
import Stars from '@/components/ui/Stars';
import { ESTADO_PROFESIONAL_LABEL } from '@/lib/constants';
import { formatFechaHora, formatPrecio } from '@/lib/utils';
import DestacadoBadge from '@/components/profile/DestacadoBadge';
import DestacadoControl from './DestacadoControl';
import EstadoActions from './EstadoActions';
import type { ProfesionalAdmin } from '@/types';

export default function AdminProfesionalRow({ profesional: p, detallado = false }: { profesional: ProfesionalAdmin; detallado?: boolean }) {
  return (
    <li className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 gap-4">
        <Avatar nombre={p.nombre} src={p.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profesionales/${p.slug}`} className="font-semibold text-ink hover:text-brand-700">
              {p.nombre}
            </Link>
            <Badge tone={estadoTone(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
            {p.is_demo && <Badge tone="neutral">Demo</Badge>}
            <DestacadoBadge nivel={p.destacado_nivel} />
          </div>
          <p className="text-sm text-brand-700">{p.especialidad}</p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2">
            <div>
              <dt className="inline font-medium text-ink">Matrícula: </dt>
              <dd className="inline">{p.matricula || '—'}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink">Provincia: </dt>
              <dd className="inline">{p.provincia || '—'}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink">Email: </dt>
              <dd className="inline break-all">{p.profile?.email || '—'}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink">WhatsApp: </dt>
              <dd className="inline">{p.whatsapp || '—'}</dd>
            </div>
            {detallado && (
              <>
                <div>
                  <dt className="inline font-medium text-ink">Precio: </dt>
                  <dd className="inline">{formatPrecio(p.precio)}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Alta: </dt>
                  <dd className="inline">{formatFechaHora(p.created_at)}</dd>
                </div>
              </>
            )}
          </dl>
          {detallado && p.bio && <p className="mt-2 line-clamp-3 text-sm text-ink">{p.bio}</p>}
          {!detallado && (
            <div className="mt-2">
              <Stars value={p.rating} count={p.resenas_count} />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2 md:justify-end">
        <Link
          href={`/admin/profesionales/${p.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold text-ink hover:border-brand-300 hover:bg-brand-50"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </Link>
        <DestacadoControl id={p.id} nivel={p.destacado_nivel} />
        <EstadoActions id={p.id} estado={p.estado} />
      </div>
    </li>
  );
}
