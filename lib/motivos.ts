import type { MotivoConsulta } from '@/types';

export function motivosDeEspecialidad(motivos: MotivoConsulta[], especialidad: string): MotivoConsulta[] {
  return motivos
    .filter((m) => m.activo && m.especialidad === especialidad)
    .sort((a, b) => a.motivo.localeCompare(b.motivo, 'es'));
}

export function separarPorEspecialidad(ids: string[], motivos: MotivoConsulta[], especialidad: string) {
  const compatibles = ids.filter((id) => motivos.some((m) => m.id === id && m.activo && m.especialidad === especialidad));
  const incompatibles = ids
    .map((id) => motivos.find((m) => m.id === id))
    .filter((m): m is MotivoConsulta => m !== undefined && m.especialidad !== especialidad);
  return { compatibles, incompatibles };
}

/**
 * Al cambiar de especialidad, pide confirmación si hay motivos que dejarían de ser válidos.
 * Devuelve la nueva selección, o null si el usuario canceló.
 */
export function confirmarCambioEspecialidad(ids: string[], motivos: MotivoConsulta[], nueva: string): string[] | null {
  const { compatibles, incompatibles } = separarPorEspecialidad(ids, motivos, nueva);
  if (incompatibles.length === 0) return compatibles;
  const lista = incompatibles.map((m) => `• ${m.motivo}`).join('\n');
  const n = incompatibles.length;
  const ok = window.confirm(
    `Al cambiar a ${nueva || 'otra especialidad'} se ${n === 1 ? 'va a quitar 1 motivo' : `van a quitar ${n} motivos`} de consulta que no pertenecen a esa especialidad:\n\n${lista}\n\n¿Querés continuar?`,
  );
  return ok ? compatibles : null;
}
