import { MessageSquare } from 'lucide-react';
import Stars from '@/components/ui/Stars';
import { formatFechaHora } from '@/lib/utils';
import type { Resena } from '@/types';

export default function ReviewsList({ resenas }: { resenas: Resena[] }) {
  if (resenas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-clinvi bg-cream p-4 text-[13px] text-muted">
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        Todavía no hay reseñas publicadas.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line-light">
      {resenas.map((r) => (
        <li key={r.id} className="py-3.5 first:pt-0 last:pb-0">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">{r.nombre || 'Paciente anónimo'}</span>
            <Stars value={r.puntuacion} showValue={false} />
          </div>
          {r.comentario && <p className="text-[13px] leading-relaxed text-muted">{r.comentario}</p>}
          <p className="mt-1 text-[11px] text-muted">{formatFechaHora(r.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}
