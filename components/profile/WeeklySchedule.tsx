import { agruparPorDia } from '@/lib/booking';
import { DIAS, DIAS_ORDEN } from '@/lib/constants';
import type { Horario } from '@/types';

export default function WeeklySchedule({ horarios }: { horarios: Horario[] }) {
  const porDia = agruparPorDia(horarios);
  if (horarios.length === 0) {
    return <p className="text-sm text-muted">Este profesional todavía no cargó horarios.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {DIAS_ORDEN.filter((d) => porDia.has(d)).map((d) => (
        <li key={d} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
          <span className="w-28 shrink-0 text-sm font-semibold text-ink">{DIAS[d]}</span>
          <span className="flex flex-wrap gap-1.5">
            {(porDia.get(d) ?? []).map((h) => (
              <span key={h} className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                {h}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
