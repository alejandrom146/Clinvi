import { DIAS_RESERVA } from '@/lib/constants';
import { horaActual, parseISODate, toISODate } from '@/lib/utils';
import type { Horario } from '@/types';

/** Próximas fechas (hasta DIAS_RESERVA) en las que el profesional tiene horarios. */
export function fechasDisponibles(horarios: Horario[], hoy: Date = new Date(), dias = DIAS_RESERVA): string[] {
  const conHorario = new Set(horarios.map((h) => h.dia_semana));
  const out: string[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    if (conHorario.has(d.getDay())) out.push(toISODate(d));
  }
  return out;
}

/** Horarios libres para una fecha: los del día de la semana, menos ocupados y menos los ya pasados. */
export function slotsDisponibles(horarios: Horario[], fecha: string, ocupados: string[], ahora: Date = new Date()): string[] {
  const dow = parseISODate(fecha).getDay();
  const esHoy = fecha === toISODate(ahora);
  const hm = horaActual(ahora);
  const ocupadosSet = new Set(ocupados);
  return horarios
    .filter((h) => h.dia_semana === dow)
    .map((h) => h.hora)
    .filter((h) => !ocupadosSet.has(h))
    .filter((h) => !esHoy || h > hm)
    .sort();
}

export function horarioKey(dia: number, hora: string): string {
  return `${dia}|${hora}`;
}

export function agruparPorDia(horarios: Horario[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const h of horarios) {
    const list = map.get(h.dia_semana) ?? [];
    list.push(h.hora);
    map.set(h.dia_semana, list);
  }
  map.forEach((list) => list.sort());
  return map;
}
