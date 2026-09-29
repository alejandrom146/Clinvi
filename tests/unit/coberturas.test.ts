import { describe, expect, it } from 'vitest';
import {
  agruparPorTipo,
  buscarCoberturas,
  coberturaDuplicada,
  coberturasActivas,
  coberturasPorProvincia,
  coberturasPorTipo,
  etiquetaCompleta,
  etiquetaCorta,
  mismaSeleccion,
  seleccionValida,
  siglaVisible,
  validarCobertura,
} from '@/lib/coberturas';
import { PROVINCIAS, TIPO_COBERTURA_VALUES } from '@/lib/constants';
import { C, COBERTURAS, COBERTURAS_ACTIVAS } from './helpers/fixtures';

describe('etiquetas sin ambigüedad', () => {
  it('coberturas con la misma sigla se distinguen por provincia', () => {
    expect(etiquetaCorta(C.osepCat)).toBe('OSEP · Catamarca');
    expect(etiquetaCorta(C.osepMza)).toBe('OSEP · Mendoza');
    expect(etiquetaCompleta(C.osepCat)).not.toBe(etiquetaCompleta(C.osepMza));
  });

  it('todas las etiquetas completas son únicas', () => {
    const etiquetas = COBERTURAS.map(etiquetaCompleta);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
  });

  it('no repite la sigla cuando es igual al nombre o ya figura en él', () => {
    expect(siglaVisible(C.osde)).toBeNull();
    expect(siglaVisible(C.pami)).toBeNull();
    expect(siglaVisible(C.osepCat)).toBe('OSEP');
    expect(etiquetaCompleta(C.osde)).toBe('OSDE');
  });

  it('usa el nombre cuando no hay sigla', () => {
    expect(etiquetaCorta(C.swiss)).toBe('Swiss Medical');
  });
});

describe('listas activas, por tipo y por provincia', () => {
  it('coberturasActivas excluye inactivas', () => {
    expect(coberturasActivas(COBERTURAS).map((c) => c.id)).not.toContain(C.iosfa.id);
  });

  it('coberturasPorTipo', () => {
    expect(coberturasPorTipo(COBERTURAS_ACTIVAS, 'otra')).toEqual([C.particular]);
  });

  it('coberturasPorProvincia no confunde provincias', () => {
    expect(coberturasPorProvincia(COBERTURAS_ACTIVAS, 'Mendoza')).toEqual([C.osepMza]);
    expect(coberturasPorProvincia(COBERTURAS_ACTIVAS, 'Córdoba')).toEqual([C.met]);
  });

  it('agruparPorTipo respeta el orden de tipos y omite grupos vacíos', () => {
    const grupos = agruparPorTipo([C.particular, C.osde, C.osepMza, C.osepCat]);
    expect(grupos.map((g) => g.tipo)).toEqual(['obra_social_provincial', 'prepaga', 'otra']);
    // Provinciales ordenadas por provincia.
    expect(grupos[0].coberturas.map((c) => c.provincia)).toEqual(['Catamarca', 'Mendoza']);
  });
});

describe('búsqueda en el selector', () => {
  it('por sigla, sin distinguir mayúsculas', () => {
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, 'osep').map((c) => c.id)).toEqual([C.osepCat.id, C.osepMza.id]);
  });

  it('por nombre y sin acentos', () => {
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, 'medicina privada')).toEqual([C.met]);
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, 'cordoba')).toEqual([C.met]);
  });

  it('sigla + provincia desambigua', () => {
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, 'OSEP mendoza')).toEqual([C.osepMza]);
  });

  it('texto vacío devuelve todo; sin coincidencias devuelve vacío', () => {
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, '  ')).toHaveLength(COBERTURAS_ACTIVAS.length);
    expect(buscarCoberturas(COBERTURAS_ACTIVAS, 'zzz')).toEqual([]);
  });
});

describe('selección del profesional', () => {
  it('seleccionValida descarta inactivas, inexistentes y repetidas (sin límite de cantidad)', () => {
    const todas = COBERTURAS_ACTIVAS.map((c) => c.id);
    expect(seleccionValida([...todas, C.iosfa.id, 'no-existe', C.osde.id], COBERTURAS_ACTIVAS)).toEqual(todas);
  });

  it('mismaSeleccion ignora el orden', () => {
    expect(mismaSeleccion([C.osde.id, C.pami.id], [C.pami.id, C.osde.id])).toBe(true);
    expect(mismaSeleccion([C.osde.id], [C.osde.id, C.pami.id])).toBe(false);
  });
});

describe('administración: duplicados y validación', () => {
  it('detecta duplicado por nombre (mayúsculas/acentos/espacios) en la misma provincia', () => {
    expect(coberturaDuplicada(COBERTURAS, { nombre: '  osde ', sigla: '', provincia: '' })).toBe(true);
  });

  it('permite la misma sigla en otra provincia (OSEP en Salta)', () => {
    expect(coberturaDuplicada(COBERTURAS, { nombre: 'Obra Social de Salta', sigla: 'OSEP', provincia: 'Salta' })).toBe(false);
  });

  it('impide la misma sigla en la misma provincia', () => {
    expect(coberturaDuplicada(COBERTURAS, { nombre: 'Otra', sigla: 'osep', provincia: 'Mendoza' })).toBe(true);
  });

  it('al editar, no se compara contra sí misma', () => {
    expect(coberturaDuplicada(COBERTURAS, { nombre: C.osde.nombre, sigla: 'OSDE', provincia: '' }, C.osde.id)).toBe(false);
  });

  it('validarCobertura', () => {
    const ok = { tipo: 'prepaga', nombre: 'Nueva', sigla: '', provincia: '', notas: '' };
    expect(validarCobertura(ok, PROVINCIAS, TIPO_COBERTURA_VALUES)).toBeNull();
    expect(validarCobertura({ ...ok, tipo: 'cualquiera' }, PROVINCIAS, TIPO_COBERTURA_VALUES)).toMatch(/tipo/);
    expect(validarCobertura({ ...ok, nombre: ' ' }, PROVINCIAS, TIPO_COBERTURA_VALUES)).toMatch(/nombre/);
    expect(validarCobertura({ ...ok, tipo: 'obra_social_provincial' }, PROVINCIAS, TIPO_COBERTURA_VALUES)).toMatch(/provincia/);
    expect(validarCobertura({ ...ok, provincia: 'Narnia' }, PROVINCIAS, TIPO_COBERTURA_VALUES)).toMatch(/provincia/);
    expect(validarCobertura({ ...ok, notas: 'x'.repeat(501) }, PROVINCIAS, TIPO_COBERTURA_VALUES)).toMatch(/notas/);
  });
});
