import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Pestañas con subrayado (estilo "search-tabs" de la referencia). */
export default function Tabs({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <div className="no-scrollbar mb-5 flex overflow-x-auto border-b-2 border-line">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? 'page' : undefined}
          className={cn(
            '-mb-0.5 shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors sm:px-5',
            t.active ? 'border-forest font-semibold text-forest' : 'border-transparent font-medium text-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-muted">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
