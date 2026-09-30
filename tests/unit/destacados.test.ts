/**
 * Profesionales destacados (plan de visibilidad):
 * aparecen primero en "Recomendados", sin saltear filtros ni tocar la puntuación.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NIVELES_DESTACADO } from '@/lib/constants';
import { esDestacado, etiquetaDestacado, nivelDestacado } from '@/lib/destacados';
import { searchProfesionales } from '@/lib/queries/profesionales';
import { DESTACADOS_PRIMERO_EN, parseFiltros, resolverFiltros } from '@/lib/search';
import type { SearchParamsRecord } from '@/types';
import { clienteFalso } from './helpers/consultaFalsa';
import { C, COBERTURAS_ACTIVAS, M, MOTIVOS_ACTIVOS, P, PROFESIONALES, type ProfesionalPrueba } from './helpers/fixtures';

const supabase = vi.hoisted(() => ({ actual: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => supabase.actual }));

/** Fede (puntuación 3.9) nivel 2, Elena (4.1) nivel 1, Diego (pendiente) nivel 3. */
const NIVELES: Record<string, number> = { [P.fede.id]: 2, [P.elena.id]: 1, [P.diego.id]: 3 };
const DATOS: ProfesionalPrueba[] = PROFESIONALES.map((p) => ({ ...p, destacado_nivel: NIVELES[p.id] ?? 0 }));

let consultas: ReturnType<typeof clienteFalso>['consultas'];
beforeEach(() => {
  const fake = clienteFalso(DATOS);
  supabase.actual = fake.cliente;
  consultas = fake.consultas;
});

async function buscar(sp: SearchParamsRecord) {
  const { filtros } = resolverFiltros(parseFiltros(sp), MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
  return (await searchProfesionales(filtros)).map((p) => p.nombre);
}

describe('orden "Recomendados" (por defecto)', () => {
  it('destacados primero, de mayor a menor nivel; después el resto por puntuación', async () => {
    expect(await buscar({})).toEqual([P.fede.nombre, P.elena.nombre, P.ana.nombre, P.carla.nombre, P.bruno.nombre]);
  });

  it('ordena por nivel antes que por puntuación', async () => {
    await buscar({});
    const ordenes = consultas.at(-1)!.llamadas.filter((l) => l.startsWith('order('));
    expect(ordenes).toEqual(['order(destacado_nivel,desc)', 'order(rating,desc)', 'order(resenas_count,desc)']);
  });

  it('dentro del mismo nivel, gana la mejor puntuación', async () => {
    const mismos = DATOS.map((p) => (p.id === P.elena.id || p.id === P.fede.id ? { ...p, destacado_nivel: 1 } : p));
    supabase.actual = clienteFalso(mismos).cliente;
    const r = await buscar({});
    expect(r.slice(0, 2)).toEqual([P.elena.nombre, P.fede.nombre]); // 4.1 antes que 3.9
  });
});

describe('ser destacado no saltea filtros ni reglas', () => {
  it('un destacado que no cumple los filtros no aparece', async () => {
    expect(await buscar({ cobertura: C.osde.id })).toEqual([P.ana.nombre, P.carla.nombre]);
    expect(await buscar({ especialidad: 'Nutrición' })).toEqual([P.carla.nombre]);
  });

  it('entre los que cumplen los filtros, el destacado va primero', async () => {
    expect(await buscar({ cobertura: C.particular.id })).toEqual([P.fede.nombre, P.ana.nombre]);
    expect(await buscar({ especialidad: 'Psicología', motivo: M.psiDuelo.id })).toEqual([P.fede.nombre, P.elena.nombre]);
  });

  it('un profesional pendiente nunca aparece, aunque tenga el nivel más alto', async () => {
    expect(await buscar({})).not.toContain(P.diego.nombre);
  });

  it('sin duplicados', async () => {
    const r = await buscar({});
    expect(new Set(r).size).toBe(r.length);
  });
});

describe('órdenes elegidos por el paciente', () => {
  it('por defecto, los destacados van primero solo en "Recomendados"', () => {
    expect(DESTACADOS_PRIMERO_EN).toEqual(['rating']);
  });

  it('A–Z y Menor precio respetan la elección del paciente', async () => {
    expect(await buscar({ especialidad: 'Psicología', orden: 'az' })).toEqual([P.ana.nombre, P.bruno.nombre, P.elena.nombre, P.fede.nombre]);
    expect(await buscar({ especialidad: 'Psicología', orden: 'precio' })).toEqual([P.fede.nombre, P.bruno.nombre, P.ana.nombre, P.elena.nombre]);
    expect(consultas.at(-1)!.llamadas.join(' ')).not.toContain('destacado_nivel');
  });
});

describe('la puntuación de pacientes no cambia', () => {
  it('el destacado conserva su rating y cantidad de reseñas', async () => {
    const { filtros } = resolverFiltros(parseFiltros({}), MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
    const fede = (await searchProfesionales(filtros)).find((p) => p.id === P.fede.id)!;
    expect(fede.rating).toBe(P.fede.rating);
    expect(fede.resenas_count).toBe(P.fede.resenas_count);
  });
});

describe('etiquetas de nivel', () => {
  it('niveles 1 a 3 con nombre; 0 sin distintivo', () => {
    expect(etiquetaDestacado(0)).toBeNull();
    expect(etiquetaDestacado(1)).toBe('Destacado');
    expect(etiquetaDestacado(2)).toBe('Destacado Plus');
    expect(etiquetaDestacado(3)).toBe('Destacado Premium');
    expect(NIVELES_DESTACADO.map((n) => n.nivel)).toEqual([0, 1, 2, 3]);
  });

  it('valores inválidos cuentan como "sin destacar"', () => {
    for (const v of [-1, 4, 1.5, Number.NaN, null, undefined]) {
      expect(nivelDestacado(v)).toBe(0);
      expect(esDestacado(v)).toBe(false);
    }
  });
});
