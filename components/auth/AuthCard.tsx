import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Contenedor de autenticación con el estilo de los modales ClinVi. */
export default function AuthCard({ title, description, children, wide = false }: { title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="px-4 py-10 sm:py-16">
      <div className={cn('mx-auto w-full rounded-clinvi-xl bg-white p-6 shadow-clinvi-lg sm:p-9', wide ? 'max-w-2xl' : 'max-w-[500px]')}>
        <h1 className="text-2xl font-normal">{title}</h1>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
