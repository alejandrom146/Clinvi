import { describe, expect, it } from 'vitest';
import { cambiarFiltro, columnasBusqueda, FILTROS_VACIOS, filtrosToQuery, parseFiltros, resolverFiltros, searchTerms } from '@/lib/search';
import { C, COBERTURAS_ACTIVAS, M, MOTIVOS, MOTIVOS_ACTIVOS } from './helpers/fixtures';

describe('parseFiltros (parámetros de la URL)', () => {
  it('acepta cobertura y motivo solo como UUID, en minúsculas', () => {
    const f = parseFiltros({ cobertura: C.osde.id.toUpperCase(), motivo: M.psiAnsiedad.id });
    expect(f.cobertura).toBe(C.osde.id);
    expect(f.motivo).toBe(M.psiAnsiedad.id);
  });

  it('una cobertura en texto ("OSEP", "OSDE") se descarta: nunca se filtra por nombre ni sigla', () => {
    expect(parseFiltros({ cobertura: 'OSEP' }).cobertura).toBe('');
    expect(parseFiltros({ cobertura: "OSDE' or 1=1" }).cobertura).toBe('');
  });

  it('compatibilidad: un motivo en texto se convierte en búsqueda libre', () => {
    const f = parseFiltros({ motivo: 'Ansiedad' });
    expect(f.motivo).toBe('');
    expect(f.q).toBe('Ansiedad');
  });

  it('valores inválidos de modalidad y orden vuelven al valor por defecto', () => {
    const f = parseFiltros({ modalidad: 'hackeo', orden: 'x' });
    expect(f.modalidad).toBe('');
    expect(f.orden).toBe('rating');
  });

  it('toma el primer valor si el parámetro viene repetido', () => {
    expect(parseFiltros({ cobertura: [C.osde.id, C.pami.id] }).cobertura).toBe(C.osde.id);
  });
});

describe('resolverFiltros (validación contra listas activas)', () => {
  const base = { ...FILTROS_VACIOS };

  it('motivo válido fija su especialidad', () => {
    const r = resolverFiltros({ ...base, motivo: M.nutTca.id }, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
    expect(r.filtros.especialidad).toBe('Nutrición');
    expect(r.motivo?.id).toBe(M.nutTca.id);
  });

  it('motivo inactivo, inexistente o de otra especialidad se descarta', () => {
    expect(resolverFiltros({ ...base, motivo: M.psiInactivo.id }, MOTIVOS_ACTIVOS).filtros.motivo).toBe('');
    // Aunque la lista recibida incluya el inactivo, se valida el flag activo.
    expect(resolverFiltros({ ...base, motivo: M.psiInactivo.id }, MOTIVOS).filtros.motivo).toBe('');
    expect(resolverFiltros({ ...base, motivo: C.osde.id }, MOTIVOS_ACTIVOS).filtros.motivo).toBe('');
    expect(resolverFiltros({ ...base, especialidad: 'Nutrición', motivo: M.psiTca.id }, MOTIVOS_ACTIVOS).filtros.motivo).toBe('');
  });

  it('cobertura válida se conserva y se devuelve el registro', () => {
    const r = resolverFiltros({ ...base, cobertura: C.osepMza.id }, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
    expect(r.filtros.cobertura).toBe(C.osepMza.id);
    expect(r.cobertura?.provincia).toBe('Mendoza');
  });

  it('cobertura inactiva o inexistente se descarta', () => {
    expect(resolverFiltros({ ...base, cobertura: C.iosfa.id }, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS).filtros.cobertura).toBe('');
    expect(resolverFiltros({ ...base, cobertura: C.iosfa.id }, MOTIVOS_ACTIVOS, [C.iosfa]).filtros.cobertura).toBe('');
    expect(resolverFiltros({ ...base, cobertura: M.psiAnsiedad.id }, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS).filtros.cobertura).toBe('');
  });

  it('la cobertura no depende de la especialidad ni del motivo', () => {
    const r = resolverFiltros({ ...base, especialidad: 'Nutrición', motivo: M.psiTca.id, cobertura: C.osde.id }, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
    expect(r.filtros.motivo).toBe('');
    expect(r.filtros.cobertura).toBe(C.osde.id);
  });

  it('no modifica el objeto recibido', () => {
    const f = { ...base, motivo: M.psiInactivo.id, cobertura: C.iosfa.id };
    resolverFiltros(f, MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
    expect(f.motivo).toBe(M.psiInactivo.id);
    expect(f.cobertura).toBe(C.iosfa.id);
  });
});

describe('cambiarFiltro (interacción en el buscador)', () => {
  const inicial = { ...FILTROS_VACIOS, especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.osde.id };

  it('cambiar la especialidad limpia el motivo incompatible pero conserva la cobertura', () => {
    const r = cambiarFiltro(inicial, 'especialidad', 'Nutrición', MOTIVOS_ACTIVOS);
    expect(r.motivo).toBe('');
    expect(r.cobertura).toBe(C.osde.id);
  });

  it('volver a la misma especialidad conserva el motivo', () => {
    expect(cambiarFiltro(inicial, 'especialidad', 'Psicología', MOTIVOS_ACTIVOS).motivo).toBe(M.psiAnsiedad.id);
  });

  it('elegir un motivo fija su especialidad y conserva la cobertura', () => {
    const r = cambiarFiltro(inicial, 'motivo', M.nutTca.id, MOTIVOS_ACTIVOS);
    expect(r.especialidad).toBe('Nutrición');
    expect(r.cobertura).toBe(C.osde.id);
  });

  it('cambiar la cobertura no toca especialidad ni motivo', () => {
    const r = cambiarFiltro(inicial, 'cobertura', C.pami.id, MOTIVOS_ACTIVOS);
    expect(r).toMatchObject({ especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.pami.id });
  });

  it('quitar la cobertura la deja vacía', () => {
    expect(cambiarFiltro(inicial, 'cobertura', '', MOTIVOS_ACTIVOS).cobertura).toBe('');
  });
});

describe('URL y columnas', () => {
  it('filtrosToQuery incluye la cobertura y es reversible con parseFiltros', () => {
    const f = { ...FILTROS_VACIOS, especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.osepCat.id, orden: 'az' as const };
    const qs = filtrosToQuery(f);
    expect(qs).toContain(`cobertura=${C.osepCat.id}`);
    expect(parseFiltros(Object.fromEntries(new URLSearchParams(qs)))).toEqual(f);
  });

  it('sin filtros relacionales no hay joins (no restringe resultados)', () => {
    expect(columnasBusqueda({ motivo: '', cobertura: '' })).toBe('*');
  });

  it('cada filtro relacional agrega su join INNER', () => {
    expect(columnasBusqueda({ motivo: 'x', cobertura: '' })).toBe('*, profesional_motivos!inner(motivo_id)');
    expect(columnasBusqueda({ motivo: '', cobertura: 'y' })).toBe('*, profesional_coberturas!inner(cobertura_id)');
  });

  it('searchTerms neutraliza comodines de ILIKE', () => {
    expect(searchTerms('50% _osde, (psi)')).toEqual(['50', 'osde', 'psi']);
  });
});
