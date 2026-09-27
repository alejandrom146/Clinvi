'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { MAX_MOTIVOS } from '@/lib/constants';
import { motivosDeEspecialidad } from '@/lib/motivos';
import { cn } from '@/lib/utils';
import type { MotivoConsulta } from '@/types';

interface Props {
  especialidad: string;
  motivos: MotivoConsulta[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** Selección de 1 a 8 motivos activos de la especialidad (chips accesibles, mobile-first). */
export default function MotivosSelector({ especialidad, motivos, value, onChange, error }: Props) {
  const [aviso, setAviso] = useState<string | null>(null);
  const disponibles = motivosDeEspecialidad(motivos, especialidad);
  const seleccion = value.filter((id) => disponibles.some((m) => m.id === id));
  const lleno = seleccion.length >= MAX_MOTIVOS;

  function toggle(id: string) {
    if (seleccion.includes(id)) {
      setAviso(null);
      onChange(seleccion.filter((x) => x !== id));
      return;
    }
    if (lleno) {
      setAviso(`Has alcanzado el máximo de ${MAX_MOTIVOS} motivos. Quitá uno para elegir otro.`);
      return;
    }
    onChange([...seleccion, id]);
  }

  return (
    <fieldset className="space-y-3" aria-describedby="motivos-ayuda">
      <legend className="text-sm font-medium text-ink">
        Motivos de consulta{disponibles.length > 0 && <span className="text-forest"> *</span>}
      </legend>

      {!especialidad ? (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Elegí primero tu especialidad para ver los motivos disponibles.</p>
      ) : disponibles.length === 0 ? (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
          Todavía no hay motivos cargados para {especialidad}. Podés continuar y elegirlos cuando estén disponibles.
        </p>
      ) : (
        <>
          <div id="motivos-ayuda" className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">Elegí hasta {MAX_MOTIVOS} motivos de consulta</p>
            <p className={cn('text-xs font-semibold', lleno ? 'text-terra-deep' : 'text-brand-700')} aria-live="polite">
              {seleccion.length} de {MAX_MOTIVOS} motivos seleccionados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {disponibles.map((m) => {
              const on = seleccion.includes(m.id);
              const bloqueado = !on && lleno;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  aria-pressed={on}
                  aria-disabled={bloqueado || undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-left text-sm font-medium transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
                    on && 'border-brand-600 bg-brand-600 text-white',
                    !on && !bloqueado && 'border-line bg-white text-ink hover:border-brand-300',
                    bloqueado && 'cursor-not-allowed border-line bg-canvas text-muted/70',
                  )}
                >
                  {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {m.motivo}
                </button>
              );
            })}
          </div>
          {lleno && (
            <p className="text-xs font-medium text-terra-deep" role="status">
              {aviso ?? `Has alcanzado el máximo de ${MAX_MOTIVOS} motivos.`}
            </p>
          )}
          <p className="text-xs text-muted">Son categorías para que los pacientes te encuentren; no representan diagnósticos.</p>
        </>
      )}
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
