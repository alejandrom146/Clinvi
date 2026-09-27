'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarCheck, CalendarX2, CheckCircle2, Clock, Info } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { fetchOcupados, reservarTurno } from '@/lib/actions/turnos';
import { fechasDisponibles, slotsDisponibles } from '@/lib/booking';
import { getErrorMessage } from '@/lib/errors';
import { cn, formatFecha, parseISODate } from '@/lib/utils';
import { hasErrors, validateReserva, type DatosPaciente, type Errores } from '@/lib/validation';
import type { EstadoProfesional, Horario } from '@/types';

interface Props {
  profesionalId: string;
  nombreProfesional: string;
  estado: EstadoProfesional;
  horarios: Horario[];
}

interface Confirmacion {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  email: string;
}

const VACIO: DatosPaciente = { nombre: '', email: '', whatsapp: '', motivo: '' };

export default function BookingWidget({ profesionalId, nombreProfesional, estado, horarios }: Props) {
  const [fechas, setFechas] = useState<string[] | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [datos, setDatos] = useState<DatosPaciente>(VACIO);
  const [errores, setErrores] = useState<Errores<keyof DatosPaciente>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  // Las fechas dependen del reloj del usuario: se calculan en el cliente para evitar desajustes de hidratación.
  useEffect(() => {
    const f = fechasDisponibles(horarios);
    setFechas(f);
    setFecha((actual) => actual ?? f[0] ?? null);
  }, [horarios]);

  const cargarOcupados = useCallback(
    async (f: string) => {
      setLoadingSlots(true);
      setError(null);
      try {
        setOcupados(await fetchOcupados(profesionalId, f));
      } catch (err) {
        setError(getErrorMessage(err, 'No pudimos cargar los horarios.'));
      } finally {
        setLoadingSlots(false);
      }
    },
    [profesionalId],
  );

  useEffect(() => {
    if (fecha) void cargarOcupados(fecha);
  }, [fecha, cargarOcupados]);

  const slots = useMemo(() => (fecha ? slotsDisponibles(horarios, fecha, ocupados) : []), [fecha, horarios, ocupados]);

  function set<K extends keyof DatosPaciente>(key: K, value: string) {
    setDatos((d) => ({ ...d, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!fecha || !hora) {
      setError('Elegí una fecha y un horario.');
      return;
    }
    const v = validateReserva(datos);
    setErrores(v);
    if (hasErrors(v)) return;

    setEnviando(true);
    try {
      const id = await reservarTurno({ profesionalId, fecha, hora, ...datos });
      setConfirmacion({ id, fecha, hora, nombre: datos.nombre.trim(), email: datos.email.trim() });
      setDatos(VACIO);
      setHora(null);
      void cargarOcupados(fecha);
    } catch (err) {
      setError(getErrorMessage(err));
      setHora(null);
      void cargarOcupados(fecha);
    } finally {
      setEnviando(false);
    }
  }

  if (estado !== 'activo') {
    return (
      <Alert variant="warning" title="Reservas no disponibles">
        Este perfil todavía no está activo, por lo que no recibe reservas.
      </Alert>
    );
  }

  if (confirmacion) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink">¡Turno reservado!</h3>
          <p className="mt-1 text-sm text-muted">Guardá estos datos. El profesional se pondrá en contacto con vos.</p>
        </div>
        <dl className="space-y-2 rounded-2xl bg-canvas p-4 text-left text-sm">
          {[
            ['Profesional', nombreProfesional],
            ['Fecha', formatFecha(confirmacion.fecha)],
            ['Horario', `${confirmacion.hora} h`],
            ['Paciente', confirmacion.nombre],
            ['Email', confirmacion.email],
            ['Código', confirmacion.id.slice(0, 8).toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" className="w-full" onClick={() => setConfirmacion(null)}>
          Reservar otro turno
        </Button>
      </div>
    );
  }

  if (fechas === null) {
    return <div className="h-40 animate-pulse rounded-2xl bg-canvas" aria-label="Cargando disponibilidad" />;
  }

  if (fechas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-canvas p-6 text-center text-sm text-muted">
        <CalendarX2 className="h-6 w-6" aria-hidden="true" />
        Este profesional no tiene horarios disponibles en las próximas semanas.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          <CalendarCheck className="h-4 w-4 text-forest" aria-hidden="true" />
          1. Elegí la fecha
        </p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {fechas.map((f) => {
            const d = parseISODate(f);
            const sel = f === fecha;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFecha(f);
                  setHora(null);
                }}
                aria-pressed={sel}
                className={cn(
                  'flex w-[54px] shrink-0 flex-col items-center rounded-[9px] border-[1.5px] py-2 transition-colors duration-150',
                  sel ? 'border-forest bg-forest/[0.07]' : 'border-line bg-cream hover:border-forest/50',
                )}
              >
                <span className="text-[10px] uppercase tracking-[0.04em] text-muted">
                  {d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span className="font-serif text-[19px] font-bold leading-tight text-forest">{d.getDate()}</span>
                <span className="text-[10px] text-muted">
                  {d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {fecha && (
        <div>
          <p className="mb-2.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            <Clock className="h-4 w-4 text-forest" aria-hidden="true" />
            2. Elegí el horario <span className="font-normal normal-case tracking-normal">· {formatFecha(fecha)}</span>
          </p>
          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-canvas" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">No quedan horarios libres este día. Probá con otra fecha.</p>
          ) : (
            <div className="grid grid-cols-3 gap-[7px]">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setHora(s)}
                  aria-pressed={hora === s}
                  className={cn(
                    'h-11 rounded-lg border-[1.5px] text-[13px] font-medium transition-colors duration-150',
                    hora === s ? 'border-forest bg-forest text-white' : 'border-line bg-cream text-muted hover:border-forest hover:bg-forest/[0.06]',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hora && (
        <div className="space-y-4 border-t border-line-light pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">3. Tus datos</p>
          <Field label="Tu nombre completo" htmlFor="b-nombre" error={errores.nombre} required>
            <Input id="b-nombre" value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} invalid={Boolean(errores.nombre)} autoComplete="name" maxLength={120} />
          </Field>
          <Field label="Email de contacto" htmlFor="b-email" error={errores.email} required>
            <Input id="b-email" type="email" value={datos.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errores.email)} autoComplete="email" />
          </Field>
          <Field label="WhatsApp" htmlFor="b-wa" error={errores.whatsapp} required>
            <Input id="b-wa" type="tel" value={datos.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} invalid={Boolean(errores.whatsapp)} autoComplete="tel" placeholder="Ej: 5493511234567" required />
          </Field>
          <Field label="Motivo de consulta (opcional)" htmlFor="b-motivo" error={errores.motivo}>
            <Textarea id="b-motivo" value={datos.motivo} onChange={(e) => set('motivo', e.target.value)} maxLength={500} className="min-h-[80px]" />
          </Field>
          <p className="flex gap-2 rounded-2xl bg-canvas p-3 text-xs leading-relaxed text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ClinVi solo coordina el turno. No interviene en la atención ni en la facturación.
          </p>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {hora && (
        <Button type="submit" variant="accent" size="lg" loading={enviando} className="w-full">
          Confirmar reserva · {hora} h
        </Button>
      )}
    </form>
  );
}