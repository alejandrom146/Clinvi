import { describe, expect, it } from 'vitest';
import { MAX_MOTIVOS, MIN_MOTIVOS } from '@/lib/constants';
import { motivosDeEspecialidad, separarPorEspecialidad } from '@/lib/motivos';
import { validateMotivos } from '@/lib/validation';
import { M, MOTIVOS } from './helpers/fixtures';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `id-${i}`);

describe('límites de selección de motivos', () => {
  it('los límites son 1 a 8', () => {
    expect(MIN_MOTIVOS).toBe(1);
    expect(MAX_MOTIVOS).toBe(8);
  });

  it('exige al menos 1 cuando la especialidad tiene motivos disponibles', () => {
    expect(validateMotivos([], 5)).toMatch(/al menos 1/);
  });

  it('no exige mínimo si la especialidad no tiene motivos cargados', () => {
    expect(validateMotivos([], 0)).toBeUndefined();
  });

  it('acepta de 1 a 8', () => {
    expect(validateMotivos(ids(1), 10)).toBeUndefined();
    expect(validateMotivos(ids(8), 10)).toBeUndefined();
  });

  it('rechaza más de 8', () => {
    expect(validateMotivos(ids(9), 10)).toMatch(/máximo 8/);
  });
});

describe('motivos por especialidad', () => {
  it('solo activos y de la especialidad pedida (mismo texto en otra especialidad no se mezcla)', () => {
    const psi = motivosDeEspecialidad(MOTIVOS, 'Psicología');
    expect(psi.map((m) => m.id)).toEqual([M.psiAnsiedad.id, M.psiDuelo.id, M.psiTca.id]);
    expect(psi.map((m) => m.id)).not.toContain(M.nutTca.id);
    expect(psi.map((m) => m.id)).not.toContain(M.psiInactivo.id);
  });

  it('al cambiar de especialidad separa compatibles e incompatibles', () => {
    const r = separarPorEspecialidad([M.psiTca.id, M.nutTca.id], MOTIVOS, 'Nutrición');
    expect(r.compatibles).toEqual([M.nutTca.id]);
    expect(r.incompatibles.map((m) => m.id)).toEqual([M.psiTca.id]);
  });
});
