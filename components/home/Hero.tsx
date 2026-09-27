import Link from 'next/link';
import { Isotipo } from '@/components/layout/Logo';
import type { HomeStats } from '@/lib/queries/profesionales';
import SearchBar from './SearchBar';
import Stats from './Stats';

const SUGERENCIAS = [
  { label: 'Ansiedad', href: '/buscar?q=Ansiedad' },
  { label: 'Psicología', href: '/buscar?especialidad=Psicolog%C3%ADa' },
  { label: 'Nutrición', href: '/buscar?especialidad=Nutrici%C3%B3n' },
  { label: 'Medicina clínica', href: '/buscar?especialidad=Medicina%20cl%C3%ADnica' },
  { label: 'Kinesiología', href: '/buscar?especialidad=Kinesiolog%C3%ADa' },
];

export default function Hero({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative overflow-hidden bg-forest px-5 pb-16 pt-14 text-center text-white sm:px-7 sm:pb-[88px] sm:pt-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(196,122,90,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(122,152,152,0.15) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[700px]">
        <Isotipo light className="mx-auto mb-7 h-[72px] w-[72px] opacity-85" />
        <h1 className="text-[clamp(34px,5.5vw,56px)] font-bold leading-[1.1] text-white">
          Salud profesional,
          <br />
          <em className="not-italic text-terra">donde estés</em>
        </h1>
        <p className="mx-auto mb-10 mt-[18px] max-w-[460px] text-base font-light leading-[1.7] text-white/80 sm:text-[17px]">
          Consultá con profesionales verificados de forma virtual. Reservá tu turno en minutos, sin intermediarios.
        </p>
        <div className="mx-auto max-w-[560px]">
          <SearchBar />
        </div>
        <div className="mt-[14px] flex flex-wrap justify-center gap-2">
          {SUGERENCIAS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] text-white/90 transition-colors hover:bg-white/20 hover:text-white"
            >
              {s.label}
            </Link>
          ))}
        </div>
        <Stats {...stats} />
      </div>
    </section>
  );
}
