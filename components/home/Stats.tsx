import type { HomeStats } from '@/lib/queries/profesionales';

/** Estadísticas del hero. */
export default function Stats({ activos, especialidades }: HomeStats) {
  const items = [
    { value: activos === null ? '—' : String(activos), label: 'Profesionales activos' },
    { value: String(especialidades), label: 'Especialidades' },
    { value: '100%', label: 'Verificados manualmente' },
  ];
  return (
    <dl className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-line pt-10 sm:mt-14">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col-reverse text-center">
          <dt className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-mist sm:text-xs">{it.label}</dt>
          <dd className="font-serif text-4xl font-normal text-forest">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
