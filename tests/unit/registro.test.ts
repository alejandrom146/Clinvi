import { describe, expect, it } from 'vitest';
import { seleccionValida } from '@/lib/coberturas';
import { validateCoberturas } from '@/lib/validation';
import { C, COBERTURAS_ACTIVAS } from './helpers/fixtures';

/** Igual que RegisterForm: solo cuentan coberturas activas de la lista. */
const validarAlta = (ids: string[]) => validateCoberturas(seleccionValida(ids, COBERTURAS_ACTIVAS), COBERTURAS_ACTIVAS.length);

describe('coberturas obligatorias en el alta', () => {
  it('sin ninguna cobertura, no deja registrarse y sugiere "Particular"', () => {
    expect(validarAlta([])).toMatch(/al menos una cobertura/);
    expect(validarAlta([])).toMatch(/Particular/);
  });

  it('"Particular" sola alcanza', () => {
    expect(validarAlta([C.particular.id])).toBeUndefined();
  });

  it('una o varias coberturas, sin límite máximo', () => {
    expect(validarAlta([C.osde.id])).toBeUndefined();
    expect(validarAlta(COBERTURAS_ACTIVAS.map((c) => c.id))).toBeUndefined();
  });

  it('una cobertura inactiva o un id inventado no cuentan para el mínimo', () => {
    expect(validarAlta([C.iosfa.id])).toMatch(/al menos una/);
    expect(validarAlta(['00000000-0000-4000-8000-999999999999'])).toMatch(/al menos una/);
  });

  it('ids repetidos cuentan una sola vez', () => {
    expect(validateCoberturas(['a', 'a'], 5)).toBeUndefined();
  });

  it('si todavía no hay coberturas cargadas, no bloquea el registro', () => {
    expect(validateCoberturas([], 0)).toBeUndefined();
  });
});
