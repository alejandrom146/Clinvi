import { Apple, Baby, Brain, Dumbbell, Ear, Pill, Smile, Sparkles, Stethoscope, type LucideIcon } from 'lucide-react';
import type { EstadoProfesional, EstadoResena, Modalidad } from '@/types';

export interface Especialidad {
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
}

export const ESPECIALIDADES: Especialidad[] = [
  { nombre: 'Psicología', descripcion: 'Ansiedad, estrés, vínculos', icon: Brain },
  { nombre: 'Psiquiatría', descripcion: 'Evaluación y tratamiento', icon: Pill },
  { nombre: 'Nutrición', descripcion: 'Planes y hábitos', icon: Apple },
  { nombre: 'Medicina clínica', descripcion: 'Consultas generales', icon: Stethoscope },
  { nombre: 'Kinesiología', descripcion: 'Rehabilitación y postura', icon: Dumbbell },
  { nombre: 'Pediatría', descripcion: 'Niñas, niños y familias', icon: Baby },
  { nombre: 'Odontología', descripcion: 'Orientación y urgencias', icon: Smile },
  { nombre: 'Dermatología', descripcion: 'Piel, cabello y uñas', icon: Sparkles },
  { nombre: 'Fonoaudiología', descripcion: 'Lenguaje y voz', icon: Ear },
];

export const ESPECIALIDAD_NOMBRES = ESPECIALIDADES.map((e) => e.nombre);

export const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export const MODALIDADES: { value: Modalidad; label: string }[] = [
  { value: 'virtual', label: 'Solo virtual' },
  { value: 'presencial', label: 'Solo presencial' },
  { value: 'ambas', label: 'Virtual y presencial' },
];

export const MODALIDAD_VALUES: Modalidad[] = MODALIDADES.map((m) => m.value);

export function modalidadLabel(m: Modalidad): string {
  return MODALIDADES.find((x) => x.value === m)?.label ?? m;
}

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
/** Orden de visualización: lunes → domingo. */
export const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];

export const HORAS_SUGERIDAS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

export const ESTADO_PROFESIONAL_LABEL: Record<EstadoProfesional, string> = {
  pendiente: 'Pendiente',
  activo: 'Activo',
  rechazado: 'Rechazado',
  inactivo: 'Inactivo',
};

export const ESTADO_RESENA_LABEL: Record<EstadoResena, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export const DIAS_RESERVA = 21;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Límites de motivos por profesional (también validados en la base). */
export const MAX_MOTIVOS = 8;
export const MIN_MOTIVOS = 1;
