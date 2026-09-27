'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ShareLink({ slug }: { slug: string }) {
  const [url, setUrl] = useState(`/profesionales/${slug}`);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/profesionales/${slug}`);
  }, [slug]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Link2 className="h-4 w-4 text-forest" aria-hidden="true" />
        Mi link
      </p>
      <p className="mt-1 text-xs text-muted">Compartilo en redes o por WhatsApp para que tus pacientes reserven directo.</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl bg-canvas px-3 py-2.5 text-xs text-ink">{url}</code>
        <Button variant="secondary" size="sm" onClick={copiar} aria-label="Copiar link">
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}
