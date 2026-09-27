import Link from 'next/link';
import { CalendarCheck, Link2, Lock } from 'lucide-react';
import { buttonClasses } from '@/components/ui/Button';

const FEATURES = [
  { icon: Link2, title: 'Link propio compartible', text: 'Tu perfil tiene una URL única para compartir en redes o WhatsApp.' },
  { icon: CalendarCheck, title: 'Turnos en tiempo real', text: 'Los pacientes ven solo los horarios disponibles. Sin doble reservas.' },
  { icon: Lock, title: 'Sin intervención clínica', text: 'ClinVi solo coordina el turno. Vos manejás tu historia clínica y facturación.' },
];

const PREVIEW = [
  { hora: '09:00', texto: 'Consulta online · Confirmado', ocupado: true },
  { hora: '10:00', texto: 'Consulta online · Confirmado', ocupado: true },
  { hora: '11:00', texto: 'Disponible', ocupado: false },
];

export default function ForProfessionals() {
  return (
    <section className="border-t border-line-light bg-white px-5 py-14 sm:px-7">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-terra-strong">Para profesionales</p>
          <h2 className="mb-3.5 text-[32px] font-bold leading-[1.2]">Tu consultorio virtual, sin complicaciones</h2>
          <p className="mb-6 text-[15px] leading-[1.7] text-muted">
            Registrate, completá tu perfil y empezá a recibir pacientes. Verificamos tu matrícula manualmente antes de activar tu perfil.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-clinvi bg-cream text-forest">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <strong className="mb-0.5 block text-sm font-semibold text-ink">{title}</strong>
                  <span className="text-[13px] leading-normal text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/registro" className={buttonClasses('primary', 'lg', 'mt-6 text-white hover:text-white')}>
            Registrarme como profesional
          </Link>
        </div>

        <div className="rounded-clinvi-xl border-[1.5px] border-line-light bg-cream p-5 sm:p-7" aria-hidden="true">
          <div className="mb-3.5 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-forest">Tu panel profesional</p>
            <span className="text-[11px] text-muted">Vista previa</span>
          </div>
          <div className="rounded-clinvi border border-line-light bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>Turnos hoy</span>
              <span className="font-serif text-lg font-bold text-forest">2</span>
            </div>
            <ul className="space-y-2">
              {PREVIEW.map((p) =>
                p.ocupado ? (
                  <li key={p.hora} className="rounded-lg bg-cream p-3">
                    <p className="text-[13px] font-semibold text-ink">{p.hora} — Paciente</p>
                    <p className="mt-0.5 text-xs text-muted">{p.texto}</p>
                  </li>
                ) : (
                  <li key={p.hora} className="rounded-lg border border-dashed border-terra/30 bg-terra/[0.08] p-3 text-[13px] text-terra-deep">
                    {p.hora} — {p.texto}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
