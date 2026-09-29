import Link from 'next/link';
import { SearchX } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-forest">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-semibold text-brand-700">Error 404</p>
      <h1 className="mt-2 text-3xl font-normal text-ink">No encontramos esta página</h1>
      <p className="mt-2 max-w-md text-muted">Puede que el enlace esté mal escrito o que el perfil ya no esté disponible.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses('primary')}>
          Ir al inicio
        </Link>
        <Link href="/buscar" className={buttonClasses('outline')}>
          Buscar profesionales
        </Link>
      </div>
    </div>
  );
}
