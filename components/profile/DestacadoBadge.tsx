import { Award } from 'lucide-react';
import { ACLARACION_DESTACADO, etiquetaDestacado } from '@/lib/destacados';
import { cn } from '@/lib/utils';

/**
 * Distintivo del plan de visibilidad. Usa los colores de acento existentes (terra)
 * y un ícono distinto a las estrellas de reseñas, para no confundirse con la puntuación.
 */
export default function DestacadoBadge({ nivel, className }: { nivel: number; className?: string }) {
  const label = etiquetaDestacado(nivel);
  if (!label) return null;
  return (
    <span
      title={ACLARACION_DESTACADO}
      className={cn('inline-flex items-center gap-1 rounded-full bg-terra/10 px-2.5 py-[3px] text-[11px] font-semibold text-terra-deep ring-1 ring-inset ring-terra/25', className)}
    >
      <Award className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
