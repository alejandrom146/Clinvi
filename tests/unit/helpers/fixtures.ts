/**
 * Datos de prueba controlados (no vienen de Supabase).
 * Incluyen a propósito los casos difíciles:
 * - el mismo texto de motivo en dos especialidades ("Trastornos alimentarios");
 * - la misma sigla en dos provincias (OSEP Catamarca / OSEP Mendoza, IPS Misiones / IPS Salta);
 * - un motivo y una cobertura inactivos con vínculos históricos;
 * - un profesional pendiente (nunca debe aparecer en el buscador);
 * - un profesional con varias coberturas y varios motivos (riesgo de duplicados).
 */
import type { Cobertura, MotivoConsulta, Profesional } from '@/types';

const T = '2026-01-01T00:00:00Z';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function motivo(n: number, especialidad: string, texto: string, activo = true): MotivoConsulta {
  return { id: id(100 + n), especialidad, motivo: texto, activo, notas: null, created_at: T, updated_at: T };
}

function cobertura(n: number, tipo: Cobertura['tipo'], nombre: string, sigla: string | null, provincia: string | null, activo = true): Cobertura {
  return { id: id(200 + n), tipo, nombre, sigla, provincia, activo, notas: null, origen: 'csv_inicial', created_at: T, updated_at: T };
}

export const M = {
  psiAnsiedad: motivo(1, 'Psicología', 'Ansiedad'),
  psiTca: motivo(2, 'Psicología', 'Trastornos alimentarios'),
  nutTca: motivo(3, 'Nutrición', 'Trastornos alimentarios'),
  psiDuelo: motivo(4, 'Psicología', 'Duelo'),
  psiInactivo: motivo(5, 'Psicología', 'Motivo retirado', false),
};

export const C = {
  osde: cobertura(1, 'prepaga', 'OSDE', 'OSDE', null),
  osepCat: cobertura(2, 'obra_social_provincial', 'Obra Social de los Empleados Públicos de Catamarca', 'OSEP', 'Catamarca'),
  osepMza: cobertura(3, 'obra_social_provincial', 'Obra Social de Empleados Públicos de Mendoza', 'OSEP', 'Mendoza'),
  ipsMis: cobertura(4, 'obra_social_provincial', 'Instituto de Previsión Social de Misiones', 'IPS', 'Misiones'),
  ipsSal: cobertura(5, 'obra_social_provincial', 'Instituto Provincial de Salud de Salta', 'IPS', 'Salta'),
  iosfa: cobertura(6, 'obra_social_nacional', 'Instituto de Obra Social de las Fuerzas Armadas y de Seguridad', 'IOSFA', null, false),
  pami: cobertura(7, 'obra_social_nacional', 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI)', 'PAMI', null),
  particular: cobertura(8, 'otra', 'Particular (sin cobertura)', null, null),
  swiss: cobertura(9, 'prepaga', 'Swiss Medical', null, null),
  met: cobertura(10, 'prepaga', 'MET Medicina Privada', null, 'Córdoba'),
};

export const MOTIVOS: MotivoConsulta[] = Object.values(M);
export const COBERTURAS: Cobertura[] = Object.values(C);
export const MOTIVOS_ACTIVOS = MOTIVOS.filter((m) => m.activo);
export const COBERTURAS_ACTIVAS = COBERTURAS.filter((c) => c.activo);

export type ProfesionalPrueba = Profesional & {
  profesional_motivos: { motivo_id: string }[];
  profesional_coberturas: { cobertura_id: string }[];
};

function pro(
  n: number,
  datos: Partial<Profesional> & Pick<Profesional, 'nombre' | 'especialidad'>,
  motivos: MotivoConsulta[],
  coberturas: Cobertura[],
): ProfesionalPrueba {
  const base: Profesional = {
    id: id(300 + n),
    user_id: null,
    slug: `pro-${n}`,
    subtitulo: null,
    bio: null,
    matricula: null,
    provincia: null,
    habilidades: [],
    motivos: [],
    modalidad: 'virtual',
    precio: null,
    whatsapp: null,
    avatar_url: null,
    estado: 'activo',
    rating: 0,
    resenas_count: 0,
    is_demo: false,
    destacado_nivel: 0,
    created_at: T,
    updated_at: T,
    ...datos,
  };
  return {
    ...base,
    search_text: `${base.nombre} ${base.especialidad}`.toLowerCase(),
    profesional_motivos: motivos.map((m) => ({ motivo_id: m.id })),
    profesional_coberturas: coberturas.map((c) => ({ cobertura_id: c.id })),
  } as ProfesionalPrueba;
}

export const P = {
  // Varias coberturas y motivos: no debe duplicarse en resultados.
  ana: pro(1, { nombre: 'Ana Psi Catamarca', especialidad: 'Psicología', provincia: 'Catamarca', rating: 4.9, precio: 20000, modalidad: 'ambas' },
    [M.psiAnsiedad, M.psiTca], [C.osde, C.osepCat, C.particular]),
  bruno: pro(2, { nombre: 'Bruno Psi Mendoza', especialidad: 'Psicología', provincia: 'Mendoza', rating: 4.5, precio: 15000, modalidad: 'presencial' },
    [M.psiAnsiedad], [C.osepMza]),
  carla: pro(3, { nombre: 'Carla Nutri', especialidad: 'Nutrición', provincia: 'Córdoba', rating: 4.7, precio: 18000 },
    [M.nutTca], [C.osde, C.met]),
  // Pendiente: tiene todo, pero nunca debe aparecer.
  diego: pro(4, { nombre: 'Diego Pendiente', especialidad: 'Psicología', estado: 'pendiente', rating: 5 },
    [M.psiAnsiedad], [C.osde]),
  // Vínculos históricos con motivo y cobertura inactivos.
  elena: pro(5, { nombre: 'Elena Historica', especialidad: 'Psicología', rating: 4.1, precio: null },
    [M.psiInactivo, M.psiDuelo], [C.iosfa, C.ipsMis]),
  fede: pro(6, { nombre: 'Fede Salta', especialidad: 'Psicología', provincia: 'Salta', rating: 3.9, precio: 12000 },
    [M.psiDuelo], [C.ipsSal, C.particular]),
};

export const PROFESIONALES: ProfesionalPrueba[] = Object.values(P);
