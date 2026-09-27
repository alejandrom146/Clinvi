import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm', className)}>{children}</div>;
}

/** Título de tarjeta: mayúsculas pequeñas, como en la referencia. */
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted', className)}>{children}</h2>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-clinvi-lg border border-dashed border-line bg-white px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-forest">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-forest" />
        {label}
      </div>
    </div>
  );
}
