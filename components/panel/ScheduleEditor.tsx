'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { guardarHorarios } from '@/lib/actions/profesional';
import { horarioKey } from '@/lib/booking';
import { DIAS, DIAS_ORDEN, HORAS_SUGERIDAS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { Horario } from '@/types';

export default function ScheduleEditor({ profesionalId, horarios }: { profesionalId: string; horarios: Horario[] }) {
  const router = useRouter();
  const inicial = useMemo(() => new Set(horarios.map((h) => horarioKey(h.dia_semana, h.hora))), [horarios]);
  const [seleccion, setSeleccion] = useState<Set<string>>(() => new Set(inicial));
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const dirty = seleccion.size !== inicial.size || Array.from(seleccion).some((k) => !inicial.has(k));

  function toggle(dia: number, hora: string) {
    setOk(false);
    setSeleccion((prev) => {
      const next = new Set(prev);
      const k = horarioKey(dia, hora);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function agregar(dia: number) {
    const hora = custom[dia];
    if (!hora || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return;
    setOk(false);
    setSeleccion((prev) => new Set(prev).add(horarioKey(dia, hora)));
    setCustom((c) => ({ ...c, [dia]: '' }));
  }

  function copiarLunes() {
    const lunes = Array.from(seleccion)
      .filter((k) => k.startsWith('1|'))
      .map((k) => k.split('|')[1]);
    setOk(false);
    setSeleccion((prev) => {
      const next = new Set(Array.from(prev).filter((k) => !['2', '3', '4', '5'].includes(k.split('|')[0])));
      for (const d of [2, 3, 4, 5]) lunes.forEach((h) => next.add(horarioKey(d, h)));
      return next;
    });
  }

  async function guardar() {
    setSaving(true);
    setError(null);
    try {
      await guardarHorarios(profesionalId, horarios, seleccion);
      setOk(true);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const horasDelDia = (dia: number) => {
    const extra = Array.from(seleccion)
      .filter((k) => k.startsWith(`${dia}|`))
      .map((k) => k.split('|')[1]);
    return Array.from(new Set([...HORAS_SUGERIDAS, ...extra])).sort();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Tocá un horario para activarlo o desactivarlo. <strong className="text-ink">{seleccion.size}</strong> horarios semanales activos.
        </p>
        <Button variant="outline" size="sm" onClick={copiarLunes}>
          Copiar lunes a martes–viernes
        </Button>
      </div>

      <div className="space-y-3">
        {DIAS_ORDEN.map((dia) => {
          const activos = Array.from(seleccion).filter((k) => k.startsWith(`${dia}|`)).length;
          return (
            <div key={dia} className="rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">
                  {DIAS[dia]} <span className="text-sm font-normal text-muted">· {activos} activos</span>
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor={`custom-${dia}`} className="sr-only">
                    Agregar horario personalizado para {DIAS[dia]}
                  </label>
                  <input
                    id={`custom-${dia}`}
                    type="time"
                    step={900}
                    value={custom[dia] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [dia]: e.target.value }))}
                    className="h-9 rounded-xl border border-line px-2 text-sm focus:border-brand-400 focus:outline-none"
                  />
                  <Button variant="secondary" size="sm" onClick={() => agregar(dia)} aria-label={`Agregar horario a ${DIAS[dia]}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {horasDelDia(dia).map((hora) => {
                  const on = seleccion.has(horarioKey(dia, hora));
                  return (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => toggle(dia, hora)}
                      aria-pressed={on}
                      className={cn(
                        'h-9 min-w-[64px] rounded-xl border px-2 text-sm font-semibold transition',
                        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-muted hover:border-brand-300',
                      )}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-clinvi-lg border border-line-light bg-white/95 p-4 shadow-clinvi-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : ok && !dirty ? (
            <span className="font-medium text-forest">Horarios guardados.</span>
          ) : dirty ? (
            <span className="text-muted">Tenés cambios sin guardar.</span>
          ) : (
            <span className="text-muted">Sin cambios.</span>
          )}
        </div>
        <Button onClick={guardar} loading={saving} disabled={!dirty}>
          Guardar horarios
        </Button>
      </div>
    </div>
  );
}
