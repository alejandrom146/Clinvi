'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Clock, ExternalLink, Home, LayoutDashboard, ShieldCheck, Star, UserPen } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import LogoutButton from '@/components/auth/LogoutButton';
import { cn } from '@/lib/utils';

interface Props {
  nombre: string | null;
  slug: string | null;
  isAdmin: boolean;
}

const item =
  'flex shrink-0 items-center gap-2.5 px-4 py-3 text-sm font-medium text-white/85 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white lg:border-l-[3px] lg:px-[22px] lg:py-[13px]';

export default function PanelSidebar({ nombre, slug, isAdmin }: Props) {
  const pathname = usePathname();
  const items = [
    { href: '/panel', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/panel/turnos', label: 'Mis turnos', icon: CalendarDays },
    { href: '/panel/horarios', label: 'Horarios', icon: Clock },
    { href: '/panel/perfil', label: 'Editar perfil', icon: UserPen },
    { href: '/panel/resenas', label: 'Reseñas', icon: Star },
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="bg-forest text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[230px] lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 lg:px-[22px] lg:pb-4 lg:pt-6">
        <Logo light />
      </div>
      <p className="hidden px-[22px] pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 lg:block">ClinVi Panel</p>
      {nombre && <p className="hidden truncate px-[22px] pb-4 text-[13px] text-white/70 lg:block">{nombre}</p>}

      <nav className="no-scrollbar flex overflow-x-auto border-t border-white/10 lg:flex-col lg:overflow-visible lg:border-t-0" aria-label="Panel">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                item,
                'border-b-[3px] lg:border-b-0',
                active ? 'border-terra bg-white/[0.12] text-white' : 'border-transparent',
              )}
            >
              <Icon className="h-[17px] w-[17px] opacity-85" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
        {slug && (
          <Link href={`/profesionales/${slug}`} className={cn(item, 'border-b-[3px] border-transparent lg:border-b-0')}>
            <ExternalLink className="h-[17px] w-[17px] opacity-85" aria-hidden="true" />
            Ver mi perfil público
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin" className={cn(item, 'border-b-[3px] border-transparent lg:border-b-0')}>
            <ShieldCheck className="h-[17px] w-[17px] opacity-85" aria-hidden="true" />
            Administración
          </Link>
        )}
      </nav>

      <div className="hidden space-y-1 border-t border-white/10 p-3 lg:mt-auto lg:block">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08] hover:text-white">
          <Home className="h-4 w-4" aria-hidden="true" />
          Ir al inicio
        </Link>
        <LogoutButton variant="ghost" className="w-full justify-start text-white/80 hover:bg-white/[0.08] hover:text-white" />
      </div>
    </aside>
  );
}
