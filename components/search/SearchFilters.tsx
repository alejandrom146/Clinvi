'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Select } from '@/components/ui/Field';
import { ESPECIALIDADES, MODALIDADES, PROVINCIAS } from '@/lib/constants';
import { filtrosToQuery } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { FiltrosBusqueda, Modalidad, MotivoConsulta, Orden } from '@/types';

const ORDENES: { value: Orden; label: string }[] = [
  { value: 'rating', label: '★ Mejor puntuados' },
  { value: 'az', label: 'A–Z' },
  { value: 'precio', label: 'Menor precio' },
];

type Tab = 'area' | 'motivo';

interface Props {
  initial: FiltrosBusqueda;
  /** Motivos activos de la lista maestra. */
  motivos: MotivoConsulta[];
}

const chip =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40';
const chipOn = 'border-forest bg-forest text-white hover:bg-forest-mid';
const chipOff = 'border-line bg-white text-muted';

export default function SearchFilters({ initial, motivos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState<FiltrosBusqueda>(initial);
  const [tab, setTab] = useState<Tab>(initial.motivo ? 'motivo' : 'area');

  function apply(next: FiltrosBusqueda) {
    startTransition(() => router.push(`/buscar${filtrosToQuery(next)}`, { scroll: false }));
  }

  function update<K extends keyof FiltrosBusqueda>(key: K, value: FiltrosBusqueda[K]) {
    const next: FiltrosBusqueda = { ...filtros, [key]: value };
    // El motivo depende de la especialidad: si deja de corresponder, se limpia.
    if (key === 'especialidad' && next.motivo) {
      const actual = motivos.find((m) => m.id === next.motivo);
      if (!actual || actual.especialidad !== value) next.motivo = '';
    }
    // Elegir un motivo fija su especialidad.
    if (key === 'motivo' && value) {
      const m = motivos.find((x) => x.id === value);
      if (m) next.especialidad = m.especialidad;
    }
    setFiltros(next);
    apply(next);
  }

  const motivosVisibles = useMemo(
    () => (filtros.especialidad ? motivos.filter((m) => m.especialidad === filtros.especialidad) : motivos),
    [motivos, filtros.especialidad],
  );
  const grupos = useMemo(() => {
    const g = new Map<string, MotivoConsulta[]>();
    for (const m of motivosVisibles) {
      const lista = g.get(m.especialidad) ?? [];
      lista.push(m);
      g.set(m.especialidad, lista);
    }
    return Array.from(g.entries());
  }, [motivosVisibles]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply(filtros);
  }

  const motivoActual = motivos.find((m) => m.id === filtros.motivo);

const pillsRaw = [
  filtros.q ? { key: 'q' as const, label: `“${filtros.q}”` } : null,
  filtros.especialidad ? { key: 'especialidad' as const, label: filtros.especialidad } : null,
  motivoActual ? { key: 'motivo' as const, label: motivoActual.motivo } : null,
  filtros.provincia ? { key: 'provincia' as const, label: filtros.provincia } : null,
  filtros.modalidad ? { key: 'modalidad' as const, label: filtros.modalidad } : null,
];

const pills = pillsRaw.filter((p): p is NonNullable<typeof p> => p !== null);

  function quitar(key: keyof FiltrosBusqueda) {
    if (key === 'especialidad') update('especialidad', '');
    else if (key === 'modalidad') update('modalidad', '');
    else if (key === 'q' || key === 'motivo' || key === 'provincia') update(key, '');
  }

  return (
    <div>
      <form onSubmit={onSubmit} role="search" className="mb-3.5 flex flex-wrap gap-2.5">
        <div className="relative min-w-0 flex-[1_1_260px] sm:max-w-[460px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" aria-hidden="true" />
          <label htmlFor="q" className="sr-only">
            Buscar por nombre, especialidad o motivo
          </label>
          <input
            id="q"
            type="search"
            value={filtros.q}
            onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
            placeholder="Nombre, motivo, especialidad..."
            className="h-11 w-full rounded-[9px] border-[1.5px] border-line bg-cream pl-10 pr-4 text-sm text-ink placeholder:text-soft focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/10"
            maxLength={100}
          />
        </div>
        <Select
          aria-label="Modalidad"
          value={filtros.modalidad}
          onChange={(e) => update('modalidad', e.target.value as '' | Modalidad)}
          className="w-auto flex-[1_1_170px] sm:flex-none"
        >
          <option value="">Virtual y presencial</option>
          {MODALIDADES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Provincia" value={filtros.provincia} onChange={(e) => update('provincia', e.target.value)} className="w-auto flex-[1_1_170px] sm:flex-none">
          <option value="">Todas las provincias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="inline-flex h-11 flex-[1_1_100%] items-center justify-center gap-2 rounded-[9px] bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-mid sm:flex-none"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Buscar
        </button>
      </form>

      <div className="no-scrollbar mb-4 flex overflow-x-auto border-b-2 border-line" role="tablist" aria-label="Tipo de búsqueda">
        {(
          [
            { id: 'area', label: 'Por área profesional' },
            { id: 'motivo', label: 'Por motivo de consulta' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-0.5 shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors sm:px-5',
              tab === t.id ? 'border-forest font-semibold text-forest' : 'border-transparent font-medium text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'area' ? (
        <div id="panel-area" role="tabpanel" aria-labelledby="tab-area" className="flex flex-wrap gap-2 pb-3">
          <button type="button" onClick={() => update('especialidad', '')} aria-pressed={!filtros.especialidad} className={cn(chip, !filtros.especialidad ? chipOn : cn(chipOff, 'hover:border-forest hover:text-forest'))}>
            Todas
          </button>
          {ESPECIALIDADES.map(({ nombre, icon: Icon }) => {
            const on = filtros.especialidad === nombre;
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => update('especialidad', on ? '' : nombre)}
                aria-pressed={on}
                className={cn(chip, on ? chipOn : cn(chipOff, 'hover:border-forest hover:text-forest'))}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {nombre}
              </button>
            );
          })}
        </div>
      ) : (
        <div id="panel-motivo" role="tabpanel" aria-labelledby="tab-motivo" className="pb-3">
          {motivosVisibles.length === 0 ? (
            <p className="text-[13px] text-muted">
              {filtros.especialidad ? `Todavía no hay motivos cargados para ${filtros.especialidad}.` : 'Todavía no hay motivos cargados.'}
            </p>
          ) : (
            <div className="space-y-4">
              {!filtros.especialidad && <p className="text-xs text-muted">Elegí un motivo o filtrá primero por área para ver solo sus motivos.</p>}
              {grupos.map(([esp, lista]) => (
                <div key={esp}>
                  {!filtros.especialidad && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{esp}</p>}
                  <div className="flex flex-wrap gap-2">
                    {lista.map((m) => {
                      const on = filtros.motivo === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => update('motivo', on ? '' : m.id)}
                          aria-pressed={on}
                          className={cn(chip, on ? chipOn : cn(chipOff, 'hover:border-terra hover:text-terra-deep'))}
                        >
                          {m.motivo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-line-light pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {pills.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-forest/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-forest">
              {p.label}
              <button
                type="button"
                onClick={() => quitar(p.key)}
                className="flex h-5 w-5 items-center justify-center rounded-full opacity-70 hover:bg-forest/10 hover:opacity-100"
                aria-label={`Quitar filtro ${p.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {pills.length > 1 && (
            <button type="button" onClick={() => router.push('/buscar')} className="px-1.5 text-xs font-medium text-muted underline-offset-2 hover:text-forest hover:underline">
              Limpiar todo
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Ordenar">
          <span className="text-xs font-medium text-muted">Ordenar:</span>
          {ORDENES.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={filtros.orden === o.value}
              onClick={() => update('orden', o.value)}
              className={cn(
                'rounded-full border-[1.5px] px-3 py-1 text-xs font-medium transition-colors',
                filtros.orden === o.value ? 'border-forest bg-forest text-white' : 'border-line bg-white text-muted hover:border-forest hover:text-forest',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
