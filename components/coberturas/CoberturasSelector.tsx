'use client';

import { useId, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { agruparPorTipo, buscarCoberturas, etiquetaCorta, siglaVisible } from '@/lib/coberturas';
import { cn } from '@/lib/utils';
import type { Cobertura } from '@/types';

interface Props {
  /** Coberturas activas de la lista maestra. */
  coberturas: Cobertura[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  /** Muestra un aviso de cambios sin guardar. */
  pendiente?: boolean;
  /** Marca el campo como obligatorio (al menos una cobertura). */
  requerido?: boolean;
}

const chip =
  'inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40';

/** Selección de coberturas aceptadas (sin límite). Chips accesibles, agrupados por tipo, mobile-first. */
export default function CoberturasSelector({ coberturas, value, onChange, error, pendiente, requerido }: Props) {
  const uid = useId();
  const [texto, setTexto] = useState('');
  const seleccion = useMemo(() => value.filter((id) => coberturas.some((c) => c.id === id)), [value, coberturas]);
  const seleccionadas = useMemo(() => coberturas.filter((c) => seleccion.includes(c.id)), [coberturas, seleccion]);
  const grupos = useMemo(() => agruparPorTipo(buscarCoberturas(coberturas, texto)), [coberturas, texto]);
  const buscando = texto.trim().length > 0;

  function toggle(id: string) {
    onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);
  }

  return (
    <fieldset className="space-y-3" aria-describedby={`${uid}-ayuda`} aria-invalid={error ? true : undefined}>
      <legend className="text-sm font-medium text-ink">
        Coberturas que aceptás{requerido && coberturas.length > 0 && <span className="text-forest"> *</span>}
      </legend>
      <p id={`${uid}-ayuda`} className="text-xs leading-relaxed text-muted">
        Elegí las obras sociales y prepagas con las que atendés. Si también atendés sin cobertura, elegí “Particular”. Los pacientes van a poder
        encontrarte filtrando por estas opciones.
      </p>

      {coberturas.length === 0 ? (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Todavía no hay coberturas disponibles. Podés continuar y elegirlas más adelante.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-brand-700" aria-live="polite">
              {seleccion.length === 0 ? 'Ninguna cobertura seleccionada' : seleccion.length === 1 ? '1 cobertura seleccionada' : `${seleccion.length} coberturas seleccionadas`}
            </p>
            {pendiente && <p className="text-xs font-semibold text-terra-deep">Cambios sin guardar</p>}
          </div>

          {seleccionadas.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Coberturas seleccionadas">
              {seleccionadas.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-forest/20 bg-forest/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-forest hover:bg-forest/15"
                    aria-label={`Quitar ${etiquetaCorta(c)}`}
                  >
                    {etiquetaCorta(c)}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor={`${uid}-buscar`} className="sr-only">
              Buscar cobertura por nombre, sigla o provincia
            </label>
            <input
              id={`${uid}-buscar`}
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por nombre, sigla o provincia"
              className="h-11 w-full rounded-[9px] border-[1.5px] border-line bg-cream pl-10 pr-4 text-sm text-ink placeholder:text-soft focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/10"
            />
          </div>

          {grupos.length === 0 ? (
            <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">No encontramos coberturas que coincidan con “{texto.trim()}”.</p>
          ) : (
            <div className="space-y-2">
              {grupos.map((g) => {
                const marcadas = g.coberturas.filter((c) => seleccion.includes(c.id)).length;
                return (
                  <details
                    key={`${g.tipo}-${buscando ? 'b' : 'n'}`}
                    open={buscando || g.tipo === 'otra' || undefined}
                    className="group rounded-[12px] border border-line-light bg-white"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      <span>
                        {g.label} <span className="font-normal text-muted">({g.coberturas.length})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {marcadas > 0 && <span className="rounded-full bg-forest/10 px-2 text-[11px] font-semibold text-forest">{marcadas}</span>}
                        <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="flex flex-wrap gap-2 border-t border-line-light px-3 py-3">
                      {g.coberturas.map((c) => {
                        const on = seleccion.includes(c.id);
                        const sigla = siglaVisible(c);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggle(c.id)}
                            aria-pressed={on}
                            title={c.nombre}
                            className={cn(chip, on ? 'border-forest bg-forest text-white hover:bg-forest-mid' : 'border-line bg-white text-muted hover:border-forest hover:text-forest')}
                          >
                            {on && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                            <span className="min-w-0">
                              {sigla ? <strong className="font-semibold">{sigla}</strong> : c.nombre}
                              {sigla && <span className="hidden sm:inline"> · {c.nombre}</span>}
                              {c.provincia && <span className={cn('ml-1 text-[11px]', on ? 'text-white/80' : 'text-soft')}>({c.provincia})</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
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
