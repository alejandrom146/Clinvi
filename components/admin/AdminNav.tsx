'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import LogoutButton from '@/components/auth/LogoutButton';
import { cn } from '@/lib/utils';

export default function AdminNav({ resenasPendientes, nombre }: { resenasPendientes: number; nombre: string }) {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'Profesionales', active: pathname === '/admin' || pathname.startsWith('/admin/profesionales') },
    { href: '/admin/motivos', label: 'Motivos', active: pathname.startsWith('/admin/motivos') },
    { href: '/admin/coberturas', label: 'Coberturas', active: pathname.startsWith('/admin/coberturas') },
    { href: '/admin/turnos', label: 'Turnos', active: pathname.startsWith('/admin/turnos') },
    { href: '/admin/resenas', label: 'Reseñas', active: pathname.startsWith('/admin/resenas'), badge: resenasPendientes },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream shadow-clinvi-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1050px] items-center justify-between gap-3 px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-terra-strong px-2.5 py-0.5 text-[11px] font-semibold text-white">Admin</span>
          <span className="hidden max-w-[220px] truncate text-sm text-muted sm:inline" title={nombre}>
            {nombre}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-forest/80 hover:text-forest sm:inline-flex">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Inicio
          </Link>
          <LogoutButton variant="ghost" />
        </div>
      </div>
      <nav className="no-scrollbar mx-auto flex w-full max-w-[1050px] overflow-x-auto px-4 sm:px-7" aria-label="Administración">
        {items.map(({ href, label, active, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-4 pb-2.5 pt-1 text-sm transition-colors sm:px-5',
              active ? 'border-forest font-semibold text-forest' : 'border-transparent font-medium text-muted hover:text-ink',
            )}
          >
            {label}
            {badge ? <span className="rounded-full bg-terra/15 px-1.5 text-[11px] font-semibold text-terra-deep">{badge}</span> : null}
          </Link>
        ))}
      </nav>
    </header>
  );
}
