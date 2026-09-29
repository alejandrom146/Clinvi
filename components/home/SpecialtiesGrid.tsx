import Link from 'next/link';
import { ESPECIALIDADES } from '@/lib/constants';

export default function SpecialtiesGrid() {
  return (
    <section id="especialidades" className="mx-auto w-full max-w-[1100px] scroll-mt-24 px-5 py-14 sm:px-7 sm:py-[60px]">
      <h2 className="text-[28px] font-normal">¿Qué especialidad buscás?</h2>
      <p className="mb-7 mt-1.5 text-[15px] text-muted">Todos los profesionales son verificados antes de aparecer en la plataforma.</p>
      <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
        {ESPECIALIDADES.map(({ nombre, icon: Icon }) => (
          <Link
            key={nombre}
            href={`/buscar?especialidad=${encodeURIComponent(nombre)}`}
            className="group flex flex-col items-center rounded-clinvi-lg border-[1.5px] border-line-light bg-white px-2.5 py-[22px] text-center transition duration-200 hover:-translate-y-0.5 hover:border-terra hover:shadow-clinvi-md"
          >
            <Icon className="mb-2.5 h-[30px] w-[30px] text-forest transition-colors group-hover:text-terra-strong" strokeWidth={1.6} aria-hidden="true" />
            <span className="text-[13px] font-medium text-muted">{nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
