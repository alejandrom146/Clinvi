import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  brand: 'bg-forest/[0.08] text-forest ring-forest/15',
  neutral: 'bg-cream text-muted ring-line',
  success: 'bg-forest/[0.08] text-forest ring-forest/15',
  warning: 'bg-terra/10 text-terra-deep ring-terra/25',
  danger: 'bg-danger/[0.08] text-danger ring-danger/20',
};

export default function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-semibold ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  );
}

export function estadoTone(estado: string): Tone {
  if (estado === 'activo' || estado === 'aprobada' || estado === 'confirmado') return 'success';
  if (estado === 'pendiente') return 'warning';
  if (estado === 'rechazado' || estado === 'rechazada' || estado === 'cancelado') return 'danger';
  return 'neutral';
}
