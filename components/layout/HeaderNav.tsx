'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, LogIn, Menu, Search, ShieldCheck, UserPlus, X } from 'lucide-react';
import Logo from './Logo';
import Modal from '@/components/ui/Modal';
import LoginForm from '@/components/auth/LoginForm';
import LogoutButton from '@/components/auth/LogoutButton';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Props {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function HeaderNav({ isLoggedIn, isAdmin }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
    setLoginOpen(false);
  }, [pathname]);

  const links = [
    { href: '/buscar', label: 'Buscar profesionales', icon: Search, show: true, variant: 'ghost' as const },
    { href: '/panel', label: 'Mi panel', icon: LayoutDashboard, show: isLoggedIn, variant: 'ghost' as const },
    { href: '/registro', label: 'Soy profesional', icon: UserPlus, show: !isLoggedIn, variant: 'outline' as const },
    { href: '/admin', label: 'Administración', icon: ShieldCheck, show: isAdmin, variant: 'accent' as const },
  ].filter((l) => l.show);

  const navBtn = 'inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors duration-150';
  const linkClass = (href: string, variant: 'ghost' | 'outline' | 'accent') => {
    const active = pathname.startsWith(href);
    if (variant === 'outline') return cn(navBtn, 'border-[1.5px] border-forest text-forest hover:bg-cream hover:text-forest');
    if (variant === 'accent') return cn(navBtn, 'bg-terra-strong text-white hover:bg-terra-deep hover:text-white');
    return cn(navBtn, active ? 'bg-cream text-forest' : 'text-muted hover:bg-cream hover:text-ink');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream shadow-clinvi-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-7">
        <Logo />

        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Principal">
          {links.map((l, i) => (
            <span key={l.href} className="contents">
              <Link href={l.href} className={linkClass(l.href, l.variant)}>
                {l.label}
              </Link>
              {i === 0 && !isLoggedIn && (
                <button type="button" onClick={() => setLoginOpen(true)} className={cn(navBtn, 'text-muted hover:bg-cream hover:text-ink')}>
                  Ingresar
                </button>
              )}
            </span>
          ))}
          {isLoggedIn && <LogoutButton variant="ghost" />}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-forest hover:bg-cream lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div id="menu-movil" className="border-t border-line-light bg-white px-4 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col" aria-label="Principal móvil">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex min-h-12 items-center gap-3 rounded-clinvi px-3 text-[15px] font-medium text-ink hover:bg-cream hover:text-ink"
              >
                <l.icon className={cn('h-5 w-5', l.variant === 'accent' ? 'text-terra-strong' : 'text-forest')} aria-hidden="true" />
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-line-light pt-4">
            {isLoggedIn ? (
              <LogoutButton className="w-full" />
            ) : (
              <button type="button" onClick={() => setLoginOpen(true)} className={buttonClasses('primary', 'md', 'w-full')}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Ingresar
              </button>
            )}
          </div>
        </div>
      )}

      <Modal open={loginOpen} onClose={closeLogin} title="Bienvenido/a" description="Ingresá para acceder a tu panel profesional">
        <LoginForm onSuccess={closeLogin} />
      </Modal>
    </header>
  );
}
