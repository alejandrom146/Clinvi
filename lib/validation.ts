import { MAX_AVATAR_BYTES, MAX_MOTIVOS, MIN_MOTIVOS } from '@/lib/constants';

export type Errores<K extends string> = Partial<Record<K, string>>;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isWhatsapp(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function parsePrecio(value: string): number | null | 'invalid' {
  const limpio = value.replace(/[.\s$]/g, '').trim();
  if (!limpio) return null;
  const n = Number(limpio);
  if (!Number.isInteger(n) || n < 0 || n > 10_000_000) return 'invalid';
  return n;
}

export function validateAvatar(file: File | null): string | null {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen (JPG, PNG o WebP).';
  if (file.size > MAX_AVATAR_BYTES) return 'La imagen no puede superar los 2 MB.';
  return null;
}

export interface DatosPaciente {
  nombre: string;
  email: string;
  whatsapp: string;
  motivo: string;
}

export function validateReserva(d: DatosPaciente): Errores<keyof DatosPaciente> {
  const e: Errores<keyof DatosPaciente> = {};
  if (d.nombre.trim().length < 2) e.nombre = 'Ingresá tu nombre completo.';
  if (!isEmail(d.email)) e.email = 'Ingresá un email válido.';
  if (d.whatsapp.trim() && !isWhatsapp(d.whatsapp)) e.whatsapp = 'Ingresá un número válido (con código de área).';
  if (d.motivo.length > 500) e.motivo = 'Máximo 500 caracteres.';
  return e;
}

export interface DatosPerfil {
  nombre: string;
  especialidad: string;
  precio: string;
  whatsapp: string;
  bio: string;
  subtitulo: string;
}

export function validatePerfil(d: DatosPerfil): Errores<keyof DatosPerfil> {
  const e: Errores<keyof DatosPerfil> = {};
  if (d.nombre.trim().length < 2) e.nombre = 'Ingresá el nombre completo.';
  if (!d.especialidad) e.especialidad = 'Elegí una especialidad.';
  if (parsePrecio(d.precio) === 'invalid') e.precio = 'Ingresá un precio válido (solo números).';
  if (d.whatsapp.trim() && !isWhatsapp(d.whatsapp)) e.whatsapp = 'Ingresá un número válido (ej: 5493511234567).';
  if (d.bio.length > 3000) e.bio = 'Máximo 3000 caracteres.';
  if (d.subtitulo.length > 160) e.subtitulo = 'Máximo 160 caracteres.';
  return e;
}

export function hasErrors(e: Record<string, string | undefined>): boolean {
  return Object.values(e).some(Boolean);
}

/** `disponibles`: motivos activos de la especialidad. Si no hay, no se exige mínimo. */
export function validateMotivos(ids: string[], disponibles: number): string | undefined {
  if (ids.length > MAX_MOTIVOS) return `Podés elegir como máximo ${MAX_MOTIVOS} motivos de consulta.`;
  if (disponibles > 0 && ids.length < MIN_MOTIVOS) return 'Elegí al menos 1 motivo de consulta.';
  return undefined;
}
