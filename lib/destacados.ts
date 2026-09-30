import { NIVELES_DESTACADO } from '@/lib/constants';

/** Nivel válido (0–3); cualquier otro valor cuenta como "sin destacar". */
export function nivelDestacado(nivel: number | null | undefined): number {
  return typeof nivel === 'number' && Number.isInteger(nivel) && nivel >= 1 && nivel <= 3 ? nivel : 0;
}

export function esDestacado(nivel: number | null | undefined): boolean {
  return nivelDestacado(nivel) > 0;
}

/** "Destacado", "Destacado Plus", "Destacado Premium" o null si no está destacado. */
export function etiquetaDestacado(nivel: number | null | undefined): string | null {
  const n = nivelDestacado(nivel);
  return n === 0 ? null : (NIVELES_DESTACADO.find((x) => x.nivel === n)?.label ?? null);
}

/** Aclaración visible para pacientes: el distintivo es un plan, no una valoración. */
export const ACLARACION_DESTACADO =
  'Profesional con plan de visibilidad en ClinVi: aparece primero en las búsquedas. No modifica su puntuación, que surge solo de reseñas de pacientes.';
