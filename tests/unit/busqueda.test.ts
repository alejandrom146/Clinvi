/**
 * Flujo completo del buscador tal como lo ejecuta /buscar:
 *   parseFiltros(URL) → resolverFiltros(listas ACTIVAS) → searchProfesionales()
 * con el cliente de Supabase reemplazado por un doble en memoria (sin red).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchProfesionales } from '@/lib/queries/profesionales';
import { parseFiltros, resolverFiltros } from '@/lib/search';
import type { SearchParamsRecord } from '@/types';
import { clienteFalso, type OpcionesConsultaFalsa } from './helpers/consultaFalsa';
import { C, COBERTURAS_ACTIVAS, M, MOTIVOS_ACTIVOS, P, PROFESIONALES } from './helpers/fixtures';

const supabase = vi.hoisted(() => ({ actual: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => supabase.actual }));

let consultas: ReturnType<typeof clienteFalso>['consultas'];

function usarDatos(opciones: OpcionesConsultaFalsa = {}) {
  const fake = clienteFalso(PROFESIONALES, opciones);
  supabase.actual = fake.cliente;
  consultas = fake.consultas;
}

/** Igual que la página /buscar: valida contra las listas activas y busca. */
async function buscar(sp: SearchParamsRecord) {
  const { filtros } = resolverFiltros(parseFiltros(sp), MOTIVOS_ACTIVOS, COBERTURAS_ACTIVAS);
  const resultados = await searchProfesionales(filtros);
  return resultados.map((p) => p.nombre);
}

beforeEach(() => usarDatos());

describe('filtros individuales', () => {
  it('sin filtros devuelve solo profesionales activos, ordenados por puntuación', async () => {
    expect(await buscar({})).toEqual([P.ana.nombre, P.carla.nombre, P.bruno.nombre, P.elena.nombre, P.fede.nombre]);
  });

  it('por especialidad', async () => {
    expect(await buscar({ especialidad: 'Nutrición' })).toEqual([P.carla.nombre]);
  });

  it('por motivo de consulta (id)', async () => {
    expect(await buscar({ motivo: M.psiAnsiedad.id })).toEqual([P.ana.nombre, P.bruno.nombre]);
  });

  it('por cobertura (id)', async () => {
    expect(await buscar({ cobertura: C.osde.id })).toEqual([P.ana.nombre, P.carla.nombre]);
  });

  it('por cobertura "Particular"', async () => {
    expect(await buscar({ cobertura: C.particular.id })).toEqual([P.ana.nombre, P.fede.nombre]);
  });

  it('nunca devuelve profesionales pendientes aunque cumplan todos los filtros', async () => {
    const r = await buscar({ especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.osde.id });
    expect(r).not.toContain(P.diego.nombre);
  });
});

describe('motivos iguales en distintas especialidades no se mezclan', () => {
  it('"Trastornos alimentarios" de Psicología no trae a la nutricionista', async () => {
    expect(await buscar({ motivo: M.psiTca.id })).toEqual([P.ana.nombre]);
  });

  it('"Trastornos alimentarios" de Nutrición no trae a la psicóloga', async () => {
    expect(await buscar({ motivo: M.nutTca.id })).toEqual([P.carla.nombre]);
  });

  it('un motivo de otra especialidad que la elegida se descarta (no mezcla)', async () => {
    // Nutrición + motivo de Psicología: el motivo se ignora y queda solo el filtro de especialidad.
    expect(await buscar({ especialidad: 'Nutrición', motivo: M.psiTca.id })).toEqual([P.carla.nombre]);
  });
});

describe('coberturas con siglas o nombres similares no se mezclan', () => {
  it('OSEP Catamarca ≠ OSEP Mendoza', async () => {
    expect(await buscar({ cobertura: C.osepCat.id })).toEqual([P.ana.nombre]);
    expect(await buscar({ cobertura: C.osepMza.id })).toEqual([P.bruno.nombre]);
  });

  it('IPS Misiones ≠ IPS Salta', async () => {
    expect(await buscar({ cobertura: C.ipsSal.id })).toEqual([P.fede.nombre]);
  });

  it('la sigla en texto ("OSEP") no se usa como filtro de cobertura', async () => {
    const todos = await buscar({});
    expect(await buscar({ cobertura: 'OSEP' })).toEqual(todos);
    expect(consultas.at(-1)?.llamadas.join(' ')).not.toContain('profesional_coberturas');
  });
});

describe('motivos y coberturas inactivos no se usan en búsquedas nuevas', () => {
  it('una cobertura inactiva se ignora (no filtra por ella ni muestra vínculos históricos)', async () => {
    const r = await buscar({ cobertura: C.iosfa.id });
    expect(consultas.at(-1)?.llamadas.join(' ')).not.toContain('profesional_coberturas');
    expect(r).toEqual(await buscar({}));
  });

  it('un motivo inactivo se ignora', async () => {
    await buscar({ motivo: M.psiInactivo.id });
    expect(consultas.at(-1)?.llamadas.join(' ')).not.toContain('profesional_motivos');
  });

  it('una cobertura inexistente (id manipulado) se ignora', async () => {
    await buscar({ cobertura: '00000000-0000-4000-8000-999999999999' });
    expect(consultas.at(-1)?.llamadas.join(' ')).not.toContain('profesional_coberturas');
  });
});

describe('combinaciones: se exigen TODOS los criterios', () => {
  it('Psicología + Ansiedad + OSDE → solo quien cumple los tres', async () => {
    expect(await buscar({ especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.osde.id })).toEqual([P.ana.nombre]);
  });

  it('no devuelve a quien cumple solo dos de tres (Bruno: Psicología + Ansiedad, sin OSDE)', async () => {
    const r = await buscar({ especialidad: 'Psicología', motivo: M.psiAnsiedad.id, cobertura: C.osde.id });
    expect(r).not.toContain(P.bruno.nombre);
  });

  it('no devuelve a quien cumple cobertura pero no especialidad (Carla: OSDE, Nutrición)', async () => {
    const r = await buscar({ especialidad: 'Psicología', cobertura: C.osde.id });
    expect(r).toEqual([P.ana.nombre]);
  });

  it('cobertura + provincia + modalidad', async () => {
    expect(await buscar({ cobertura: C.osepMza.id, provincia: 'Mendoza', modalidad: 'presencial' })).toEqual([P.bruno.nombre]);
    expect(await buscar({ cobertura: C.osepMza.id, provincia: 'Catamarca' })).toEqual([]);
  });

  it('cobertura + texto libre', async () => {
    expect(await buscar({ cobertura: C.osde.id, q: 'nutri' })).toEqual([P.carla.nombre]);
  });

  it('combinación sin coincidencias devuelve lista vacía', async () => {
    expect(await buscar({ motivo: M.nutTca.id, cobertura: C.osepCat.id })).toEqual([]);
  });

  it('aplica un join INNER por cada relación filtrada', async () => {
    await buscar({ motivo: M.psiAnsiedad.id, cobertura: C.osde.id });
    const sql = consultas.at(-1)!.llamadas.join(' ');
    expect(sql).toContain('profesional_motivos!inner(motivo_id)');
    expect(sql).toContain('profesional_coberturas!inner(cobertura_id)');
    expect(sql).toContain(`eq(profesional_motivos.motivo_id,${M.psiAnsiedad.id})`);
    expect(sql).toContain(`eq(profesional_coberturas.cobertura_id,${C.osde.id})`);
  });
});

describe('sin profesionales duplicados', () => {
  it('quien tiene 3 coberturas y 2 motivos aparece una sola vez', async () => {
    for (const sp of [{}, { especialidad: 'Psicología' }, { motivo: M.psiAnsiedad.id, cobertura: C.osde.id }, { cobertura: C.particular.id }]) {
      const r = await buscar(sp);
      expect(r.filter((n) => n === P.ana.nombre)).toHaveLength(1);
      expect(new Set(r).size).toBe(r.length);
    }
  });

  it('si la API devolviera filas repetidas, el resultado igual no tiene duplicados', async () => {
    usarDatos({ duplicarFilas: true });
    const r = await buscar({ cobertura: C.osde.id });
    expect(r).toEqual([P.ana.nombre, P.carla.nombre]);
  });
});

describe('orden y límite existentes se mantienen', () => {
  it('orden A–Z y por precio (sin precio al final)', async () => {
    expect(await buscar({ especialidad: 'Psicología', orden: 'az' })).toEqual([P.ana.nombre, P.bruno.nombre, P.elena.nombre, P.fede.nombre]);
    expect(await buscar({ especialidad: 'Psicología', orden: 'precio' })).toEqual([P.fede.nombre, P.bruno.nombre, P.ana.nombre, P.elena.nombre]);
  });

  it('pide como máximo 60 resultados', async () => {
    await buscar({ cobertura: C.osde.id });
    expect(consultas.at(-1)!.llamadas).toContain('limit(60)');
  });
});

describe('errores y resultados vacíos', () => {
  it('un error de Supabase se convierte en un error genérico, sin detalles técnicos', async () => {
    usarDatos({ error: { message: 'permission denied for table profesionales', code: '42501' } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(searchProfesionales(parseFiltros({}))).rejects.toThrow(/^BUSQUEDA_FALLIDA$/);
    expect(log).toHaveBeenCalled(); // el detalle queda solo en el log del servidor
  });

  it('data null sin error devuelve lista vacía', async () => {
    usarDatos({ dataNull: true });
    expect(await searchProfesionales(parseFiltros({}))).toEqual([]);
  });
});
