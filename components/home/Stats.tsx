import type { HomeStats } from '@/lib/queries/profesionales';

/** Estadísticas del hero (sobre fondo forest). */
export default function Stats({ activos, especialidades }: HomeStats) {
  const items = [
    { value: activos === null ? '—' : String(activos), label: 'Profesionales activos' },
    { value: String(especialidades), label: 'Especialidades' },
    { value: '100%', label: 'Verificados manualmente' },
  ];
  return (
    <dl className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-white/[0.12] pt-10 sm:mt-14">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col-reverse text-center">
          <dt className="mt-0.5 text-[13px] font-light text-white/70">{it.label}</dt>
          <dd className="font-serif text-4xl font-bold">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
