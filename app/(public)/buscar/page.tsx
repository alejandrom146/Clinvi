import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import ProfessionalCard from '@/components/search/ProfessionalCard';
import SearchFilters from '@/components/search/SearchFilters';
import SetupNotice from '@/components/SetupNotice';
import { EmptyState } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/lib/config';
import { etiquetaCorta } from '@/lib/coberturas';
import { getCoberturasActivas } from '@/lib/queries/coberturas';
import { getMotivosActivos } from '@/lib/queries/motivos';
import { searchProfesionales } from '@/lib/queries/profesionales';
import { filtrosToQuery, parseFiltros, resolverFiltros } from '@/lib/search';
import type { SearchParamsRecord } from '@/types';

export const metadata: Metadata = { title: 'Buscar profesionales' };

export default async function BuscarPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const parsed = parseFiltros(await searchParams);

  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );
  }

  const [motivos, coberturas] = await Promise.all([getMotivosActivos(), getCoberturasActivas()]);
  const { filtros, motivo, cobertura } = resolverFiltros(parsed, motivos, coberturas);
  const resultados = await searchProfesionales(filtros);
  const base = motivo ? `${motivo.especialidad}: ${motivo.motivo}` : filtros.especialidad || 'Profesionales';
  const titulo = cobertura ? `${base} · ${etiquetaCorta(cobertura)}` : base;

  return (
    <>
      <div className="border-b border-line bg-white px-4 py-5 sm:px-7">
        <div className="mx-auto max-w-[1100px]">
          <h1 className="text-[28px] font-bold leading-tight">{titulo}</h1>
          <p className="mb-4 mt-1 text-sm text-muted">Solo mostramos profesionales con matrícula verificada.</p>
          <SearchFilters key={filtrosToQuery(filtros)} initial={filtros} motivos={motivos} coberturas={coberturas} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-7 sm:py-7">
        <p className="mb-4 text-[13px] text-muted" aria-live="polite">
          {resultados.length === 1 ? '1 profesional encontrado' : `${resultados.length} profesionales encontrados`}
        </p>
        {resultados.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No encontramos profesionales con esos criterios"
            description="Probá con otra especialidad, otro motivo de consulta, otra cobertura o quitá algunos filtros."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {resultados.map((p) => (
              <ProfessionalCard key={p.id} profesional={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
