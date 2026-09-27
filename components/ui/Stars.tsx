import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Stars({
  value,
  count,
  size = 'sm',
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: 'sm' | 'lg';
  showValue?: boolean;
}) {
  const v = Number(value) || 0;
  const full = Math.round(v);
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={v > 0 ? `${v.toFixed(1)} de 5 estrellas` : 'Sin calificaciones'}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(icon, i <= full ? 'fill-terra text-terra' : 'fill-line text-line')}
            aria-hidden="true"
          />
        ))}
      </span>
      {showValue && (
        <span className={cn('font-semibold text-ink', size === 'sm' ? 'text-[13px]' : 'font-serif text-2xl font-bold text-forest')}>{v > 0 ? v.toFixed(1) : 'Nuevo'}</span>
      )}
      {count !== undefined && count > 0 && <span className="text-xs text-muted">({count})</span>}
    </span>
  );
}
