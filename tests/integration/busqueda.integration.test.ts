/**
 * Pruebas de INTEGRACIÓN: ejecutan el código real del buscador contra la API
 * real de Supabase (PostgREST + RLS), como visitante anónimo.
 *
 * ⚠️  Usar SOLO un proyecto de Supabase de PRUEBA con tests/integration/fixture.sql.
 * Variables requeridas (si faltan, las pruebas se omiten):
 *   CLINVI_TEST_SUPABASE_URL       ej. https://xxxx.supabase.co
 *   CLINVI_TEST_SUPABASE_ANON_KEY  anon key del proyecto de prueba (nunca la service_role)
 */
import { createClient as crearClienteSupabase, type SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getCoberturasActivas } from '@/lib/queries/coberturas';
import { getMotivosActivos } from '@/lib/queries/motivos';
import { getProfesionalBySlug, searchProfesionales } from '@/lib/queries/profesionales';
import { parseFiltros, resolverFiltros } from '@/lib/search';
import type { Cobertura, MotivoConsulta, SearchParamsRecord } from '@/types';

const URL = process.env.CLINVI_TEST_SUPABASE_URL ?? '';
const KEY = process.env.CLINVI_TEST_SUPABASE_ANON_KEY ?? '';
const habilitado = URL.startsWith('http') && KEY.length > 20;

const cliente = vi.hoisted(() => ({ actual: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => cliente.actual }));

const F = {
  ana: '00000000-0000-4000-9000-0000000000f1',
  bruno: '00000000-0000-4000-9000-0000000000f2',
  carla: '00000000-0000-4000-9000-0000000000f3',
  diego: '00000000-0000-4000-9000-0000000000f4',
  elena: '00000000-0000-4000-9000-0000000000f5',
};
const COBERTURA_ZZ = '00000000-0000-4000-9000-00000000c0f1';
const MOTIVO_ZZ = '00000000-0000-4000-9000-00000000a0f1';
const esFixture = (id: string) => Object.values(F).includes(id);

describe.skipIf(!habilitado)('integración: buscador y seguridad contra Supabase', () => {
  let supabase: SupabaseClient;
  let motivos: MotivoConsulta[];
  let coberturas: Cobertura[];
  const cob = (sigla: string, provincia: string | null = null) => {
    const c = coberturas.find((x) => x.sigla === sigla && x.provincia === provincia);
    if (!c) throw new Error(`Falta la cobertura ${sigla} ${provincia ?? ''}: ¿se importó el CSV?`);
    return c.id;
  };
  const mot = (especialidad: string, texto: string) => {
    const m = motivos.find((x) => x.especialidad === especialidad && x.motivo === texto);
    if (!m) throw new Error(`Falta el motivo ${especialidad}: ${texto}`);
    return m.id;
  };
  async function buscar(sp: SearchParamsRecord): Promise<string[]> {
    const { filtros } = resolverFiltros(parseFiltros(sp), motivos, coberturas);
    return (await searchProfesionales(filtros)).map((p) => p.id);
  }

  beforeAll(async () => {
    supabase = crearClienteSupabase(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    cliente.actual = supabase;
    [motivos, coberturas] = await Promise.all([getMotivosActivos(), getCoberturasActivas()]);
    const { count } = await supabase.from('profesionales').select('id', { count: 'exact', head: true }).in('id', Object.values(F));
    if (count !== 4) throw new Error('No se encontraron los datos de prueba: ejecutá tests/integration/fixture.sql en el proyecto de PRUEBA.');
  });

  it('las listas públicas solo traen elementos activos', () => {
    expect(coberturas.every((c) => c.activo)).toBe(true);
    expect(coberturas.map((c) => c.id)).not.toContain(COBERTURA_ZZ);
    expect(coberturas.find((c) => c.sigla === 'IOSFA')).toBeUndefined();
  });

  it('Psicología + Ansiedad + OSDE → solo quien cumple los tres criterios', async () => {
    const r = await buscar({ especialidad: 'Psicología', motivo: mot('Psicología', 'Ansiedad'), cobertura: cob('OSDE') });
    expect(r).toEqual([F.ana]);
  });

  it('OSEP Catamarca y OSEP Mendoza no se mezclan', async () => {
    expect(await buscar({ cobertura: cob('OSEP', 'Catamarca') })).toEqual([F.ana]);
    expect(await buscar({ cobertura: cob('OSEP', 'Mendoza') })).toEqual([F.bruno]);
  });

  it('el mismo motivo en dos especialidades no se mezcla', async () => {
    const psi = (await buscar({ motivo: mot('Psicología', 'Trastornos alimentarios') })).filter(esFixture);
    const nut = (await buscar({ motivo: mot('Nutrición', 'Trastornos alimentarios') })).filter(esFixture);
    expect(psi).toEqual([F.ana]);
    expect(nut).toEqual([F.carla]);
  });

  it('un profesional con varias coberturas y motivos no se duplica (join real muchos a muchos)', async () => {
    for (const sp of [{}, { cobertura: cob('OSDE') }, { motivo: mot('Psicología', 'Ansiedad'), cobertura: cob('OSDE') }]) {
      const r = await buscar(sp);
      expect(new Set(r).size).toBe(r.length);
      expect(r.filter((id) => id === F.ana)).toHaveLength(1);
    }
  });

  it('los profesionales pendientes nunca aparecen', async () => {
    expect(await buscar({ cobertura: cob('OSDE') })).not.toContain(F.diego);
  });

  it('una cobertura inactiva no se usa para buscar (se ignora el filtro)', async () => {
    const { filtros, cobertura } = resolverFiltros(parseFiltros({ cobertura: COBERTURA_ZZ }), motivos, coberturas);
    expect(cobertura).toBeNull();
    expect(filtros.cobertura).toBe('');
  });

  it('aun forzando el id de una cobertura inactiva en la consulta, la base no devuelve vínculos históricos', async () => {
    const r = await searchProfesionales({ ...parseFiltros({}), cobertura: COBERTURA_ZZ });
    expect(r).toEqual([]);
  });

  it('el perfil público muestra solo coberturas activas', async () => {
    const perfil = await getProfesionalBySlug('zz-prueba-f5');
    expect(perfil?.coberturas.map((c) => c.sigla)).toEqual(['PAMI']);
  });

  it('motivo desactivado: se ignora como filtro y su vínculo histórico no es público', async () => {
    expect(motivos.map((m) => m.id)).not.toContain(MOTIVO_ZZ);
    expect(resolverFiltros(parseFiltros({ motivo: MOTIVO_ZZ }), motivos, coberturas).filtros.motivo).toBe('');
    expect(await searchProfesionales({ ...parseFiltros({}), motivo: MOTIVO_ZZ })).toEqual([]);
    const { data } = await supabase.from('profesional_motivos').select('motivo_id').eq('profesional_id', F.elena);
    expect((data ?? []).map((r: { motivo_id: string }) => r.motivo_id)).not.toContain(MOTIVO_ZZ);
    expect(data ?? []).toHaveLength(1); // control: el motivo activo ("Duelo") sí se ve
    const perfil = await getProfesionalBySlug('zz-prueba-f5');
    expect(perfil?.motivosConsulta.map((m) => m.motivo)).toEqual(['Duelo']);
  });

  it('destacados primero en Recomendados, sin cambiar su puntuación', async () => {
    const r = (await searchProfesionales(parseFiltros({ especialidad: 'Psicología' }))).filter((p) => esFixture(p.id));
    expect(r.map((p) => p.id)).toEqual([F.elena, F.ana, F.bruno]);
    expect(r[0].destacado_nivel).toBe(2);
    expect(Number(r[0].rating)).toBeCloseTo(4.1);
  });

  it('A–Z respeta la elección del paciente aunque haya destacados', async () => {
    const r = (await searchProfesionales(parseFiltros({ especialidad: 'Psicología', orden: 'az' }))).filter((p) => esFixture(p.id));
    expect(r.map((p) => p.id)).toEqual([F.ana, F.bruno, F.elena]);
  });

  it('un visitante no puede cambiar el nivel de destacado', async () => {
    const { data } = await supabase.from('profesionales').update({ destacado_nivel: 3 }).eq('id', F.ana).select('id');
    expect(data ?? []).toHaveLength(0);
    const perfil = await getProfesionalBySlug('zz-prueba-f1');
    expect(perfil?.destacado_nivel).toBe(0);
  });

  it('un visitante no puede crear, editar ni asignar coberturas', async () => {
    const alta = await supabase.from('coberturas').insert({ tipo: 'prepaga', nombre: 'ZZ Intrusa' });
    expect(alta.error).not.toBeNull();

    const edicion = await supabase.from('coberturas').update({ activo: false }).eq('id', cob('OSDE')).select('id');
    expect(edicion.data ?? []).toHaveLength(0);

    const rpc = await supabase.rpc('set_profesional_coberturas', { p_profesional_id: F.ana, p_cobertura_ids: [cob('PAMI')] });
    expect(rpc.error).not.toBeNull();

    const vinculo = await supabase.from('profesional_coberturas').insert({ profesional_id: F.ana, cobertura_id: cob('PAMI') });
    expect(vinculo.error).not.toBeNull();
  });
});
