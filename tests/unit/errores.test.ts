import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@/lib/errors';

describe('mensajes de error para el usuario', () => {
  it('traduce los códigos de coberturas de la base', () => {
    expect(getErrorMessage({ message: 'COBERTURA_INVALIDA' })).toMatch(/no existe o ya no está disponible/);
    expect(getErrorMessage({ message: 'COBERTURA_INACTIVA' })).toMatch(/ya no está disponible/);
    expect(getErrorMessage(new Error('COBERTURA_DUPLICADA'))).toMatch(/Ya existe una cobertura/);
  });

  it('la búsqueda fallida muestra un mensaje claro', () => {
    expect(getErrorMessage(new Error('BUSQUEDA_FALLIDA'))).toBe('No pudimos completar la búsqueda. Intentá nuevamente en unos minutos.');
  });

  it('los errores de permisos no exponen detalles técnicos', () => {
    const texto = getErrorMessage({ message: 'new row violates row-level security policy for table "coberturas"', code: '42501' });
    expect(texto).toBe('No tenés permisos para realizar esta acción.');
    expect(getErrorMessage({ message: 'NO_AUTORIZADO' })).toBe('No tenés permisos para realizar esta acción.');
  });

  it('si falta la migración, indica qué archivo ejecutar', () => {
    expect(getErrorMessage({ message: 'relation "public.coberturas" does not exist' })).toMatch(/coberturas\.sql/);
    expect(getErrorMessage({ message: 'Could not find the function public.set_profesional_coberturas' })).toMatch(/coberturas\.sql/);
  });

  it('duplicados genéricos (23505) y errores vacíos', () => {
    expect(getErrorMessage({ message: 'duplicate key', code: '23505' })).toBe('Ese registro ya existe.');
    expect(getErrorMessage(null)).toBe('Ocurrió un error. Intentá nuevamente.');
  });

  it('los códigos de motivos siguen funcionando', () => {
    expect(getErrorMessage({ message: 'MOTIVOS_MAXIMO' })).toMatch(/máximo 8/);
  });
});
