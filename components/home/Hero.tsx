import Link from 'next/link';
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
    <section className="border-b border-line bg-cream px-5 pb-16 pt-14 text-center text-forest sm:px-7 sm:pb-[88px] sm:pt-20">
      <div className="mx-auto max-w-[700px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/clinvi-logo.jpg" alt="" className="mx-auto mb-[22px] block h-20 w-auto sm:h-24" />
        <p className="mb-[22px] text-[11px] uppercase tracking-[0.28em] text-mist sm:text-[13px]">Clínica Interdisciplinaria Virtual</p>
        <h1 className="text-[clamp(32px,5.5vw,56px)] font-normal leading-[1.1] text-forest">
          Salud profesional,
          <br />
          <em className="italic text-terra">donde estés</em>
        </h1>
        <p className="mx-auto mb-10 mt-[18px] max-w-[460px] text-base leading-[1.7] text-muted sm:text-[17px]">
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
              className="rounded-full border border-line bg-transparent px-4 py-1.5 text-[13px] text-muted transition-colors hover:border-mist hover:bg-white hover:text-muted"
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
