'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Award } from 'lucide-react';
import { cambiarDestacado } from '@/lib/actions/profesional';
import { NIVELES_DESTACADO } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { nivelDestacado } from '@/lib/destacados';

/** Selector de nivel de destacado (solo admin). Guarda al elegir y confirma solo si la base lo aceptó. */
export default function DestacadoControl({ id, nivel }: { id: string; nivel: number }) {
  const router = useRouter();
  const uid = useId();
  const [valor, setValor] = useState(nivelDestacado(nivel));
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onChange(nuevo: number) {
    const anterior = valor;
    setValor(nuevo);
    setEstado('guardando');
    setError('');
    try {
      await cambiarDestacado(id, nuevo);
      setEstado('ok');
      router.refresh();
    } catch (err) {
      setValor(anterior);
      setEstado('error');
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${uid}-dest`} className="sr-only">
        Nivel de destacado
      </label>
      <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white pl-3 pr-1 text-sm">
        <Award className="h-3.5 w-3.5 text-terra-deep" aria-hidden="true" />
        <select
          id={`${uid}-dest`}
          value={valor}
          disabled={estado === 'guardando'}
          onChange={(e) => void onChange(Number(e.target.value))}
          className="h-8 cursor-pointer rounded-full bg-transparent pr-1 text-sm font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:opacity-60"
        >
          {NIVELES_DESTACADO.map((n) => (
            <option key={n.nivel} value={n.nivel}>
              {n.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-muted" aria-live="polite">
        {estado === 'guardando' && 'Guardando…'}
        {estado === 'ok' && 'Guardado'}
        {estado === 'error' && <span className="text-danger">{error}</span>}
      </p>
    </div>
  );
}
