import { TIMEZONE } from '@/lib/config';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrecio(precio: number | null): string {
  if (precio === null || precio === undefined) return 'A convenir';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local a "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" a Date local (sin corrimiento de zona horaria). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function horaActual(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Hoy en Argentina, para usar en el servidor (que suele correr en UTC). */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

export function formatFecha(iso: string, estilo: 'larga' | 'corta' = 'larga'): string {
  const d = parseISODate(iso);
  if (estilo === 'corta') {
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  const txt = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export function formatFechaHora(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function whatsappLink(numero: string | null, texto?: string): string | null {
  if (!numero) return null;
  const digits = numero.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

export function initials(nombre: string): string {
  const limpio = nombre.replace(/^(Dr\.|Dra\.|Lic\.|Od\.|Klgo\.|Mg\.)\s*/i, '');
  return limpio
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function splitList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

/** Minúsculas y sin acentos (coincide con public.normalizar en SQL). */
export function normalizar(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Evita open-redirects: solo rutas internas. */
export function safeNext(next: string | null | undefined, fallback = '/panel'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
