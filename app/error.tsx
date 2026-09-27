'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button, { buttonClasses } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-terra/10 text-danger">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-ink">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        No pudimos cargar esta sección. Si el problema persiste, revisá la conexión con Supabase y que se haya ejecutado supabase/schema.sql.
      </p>
      {error.message && <code className="mt-4 max-w-lg break-words rounded-xl bg-canvas px-3 py-2 text-xs text-muted">{error.message}</code>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/" className={buttonClasses('outline')}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
