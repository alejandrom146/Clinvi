'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import Badge, { estadoTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import Stars from '@/components/ui/Stars';
import { eliminarResena, moderarResena } from '@/lib/actions/resenas';
import { ESTADO_RESENA_LABEL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { formatFechaHora } from '@/lib/utils';
import type { EstadoResena, ResenaConProfesional } from '@/types';

export default function ResenaModeration({ resenas }: { resenas: ResenaConProfesional[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setError(null);
    setLoading(key);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  const moderar = (id: string, estado: EstadoResena) => run(`${id}-${estado}`, () => moderarResena(id, estado));
  const eliminar = (id: string) => {
    if (!window.confirm('¿Eliminar esta reseña definitivamente?')) return;
    void run(`${id}-del`, () => eliminarResena(id));
  };

  if (resenas.length === 0) return <EmptyState icon={MessageSquare} title="No hay reseñas en esta categoría." />;

  return (
    <div className="space-y-3">
      {error && <p className="rounded-[9px] border border-terra/30 bg-terra/[0.08] px-4 py-3 text-sm text-danger">{error}</p>}
      <ul className="divide-y divide-line overflow-hidden rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm">
        {resenas.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.puntuacion} showValue={false} />
                <Badge tone={estadoTone(r.estado)}>{ESTADO_RESENA_LABEL[r.estado]}</Badge>
                <span className="text-xs text-muted">{formatFechaHora(r.created_at)}</span>
              </div>
              {r.profesional && (
                <Link href={`/profesionales/${r.profesional.slug}`} className="mt-1 inline-block text-sm font-semibold text-forest hover:text-forest-mid hover:underline">
                  {r.profesional.nombre}
                </Link>
              )}
              <p className="mt-1 text-sm text-ink">{r.comentario || <span className="italic text-muted">Sin comentario</span>}</p>
              <p className="mt-1 text-xs text-muted">Por: {r.nombre || 'Anónimo'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.estado !== 'aprobada' && (
                <Button size="sm" loading={loading === `${r.id}-aprobada`} onClick={() => moderar(r.id, 'aprobada')}>
                  Aprobar
                </Button>
              )}
              {r.estado !== 'rechazada' && (
                <Button size="sm" variant="outlineAccent" loading={loading === `${r.id}-rechazada`} onClick={() => moderar(r.id, 'rechazada')}>
                  Rechazar
                </Button>
              )}
              <Button size="sm" variant="ghost" loading={loading === `${r.id}-del`} onClick={() => eliminar(r.id)} className="text-danger hover:bg-danger/[0.06] hover:text-danger">
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
