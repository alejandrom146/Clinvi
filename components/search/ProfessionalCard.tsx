import Link from 'next/link';
import { BadgeCheck, MapPin } from 'lucide-react';
import DestacadoBadge from '@/components/profile/DestacadoBadge';
import Avatar from '@/components/ui/Avatar';
import Stars from '@/components/ui/Stars';
import { formatPrecio } from '@/lib/utils';
import type { Profesional } from '@/types';

export default function ProfessionalCard({ profesional: p }: { profesional: Profesional }) {
  const virtual = p.modalidad === 'virtual' || p.modalidad === 'ambas';
  const presencial = p.modalidad === 'presencial' || p.modalidad === 'ambas';

  return (
    <Link
      href={`/profesionales/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-clinvi-lg border border-line-light bg-white text-ink shadow-clinvi-sm transition duration-200 hover:-translate-y-[3px] hover:text-ink hover:shadow-clinvi-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
    >
      <div className="flex items-start gap-3.5 px-5 pb-3.5 pt-[22px]">
        <Avatar nombre={p.nombre} src={p.avatar_url} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-normal leading-snug text-forest">{p.nombre}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {p.especialidad}
            {p.provincia && (
              <span className="inline-flex items-center gap-0.5">
                {' · '}
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {p.provincia}
              </span>
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-forest/[0.08] px-2.5 py-[3px] text-[11px] font-semibold text-forest">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              Verificado
            </span>
            <DestacadoBadge nivel={p.destacado_nivel} />
          </div>
          <div className="mt-1.5">
            <Stars value={p.rating} count={p.resenas_count} />
          </div>
        </div>
      </div>

      {p.habilidades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3.5">
          {p.habilidades.slice(0, 3).map((h) => (
            <span key={h} className="rounded-full border border-line bg-cream px-[11px] py-1 text-xs font-medium text-muted">
              {h}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />
      <div className="flex items-center justify-between gap-3 border-t border-line-light px-5 py-3.5">
        <div className="min-w-0">
          <p className="font-serif text-lg font-normal text-ink">
            {formatPrecio(p.precio)}
            {p.precio !== null && <small className="ml-1 font-sans text-xs font-normal text-muted">/ consulta</small>}
          </p>
          <div className="mt-0.5 flex flex-col gap-[3px]">
            {virtual && (
              <span className="flex items-center gap-[5px] text-[11px] text-muted">
                <span className="h-[7px] w-[7px] rounded-full bg-forest" aria-hidden="true" />
                Virtual
              </span>
            )}
            {presencial && (
              <span className="flex items-center gap-[5px] text-[11px] text-muted">
                <span className="h-[7px] w-[7px] rounded-full bg-terra" aria-hidden="true" />
                Presencial
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-forest px-[18px] py-[9px] text-[13px] font-semibold text-white transition-colors group-hover:bg-forest-mid">
          Ver perfil
        </span>
      </div>
    </Link>
  );
}
