export type Rol = 'profesional' | 'admin';
export type EstadoProfesional = 'pendiente' | 'activo' | 'rechazado' | 'inactivo';
export type Modalidad = 'virtual' | 'presencial' | 'ambas';
export type EstadoTurno = 'confirmado' | 'cancelado';
export type EstadoResena = 'pendiente' | 'aprobada' | 'rechazada';
export type Orden = 'rating' | 'az' | 'precio';

export interface Profile {
  id: string;
  rol: Rol;
  nombre: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profesional {
  id: string;
  user_id: string | null;
  slug: string;
  nombre: string;
  especialidad: string;
  subtitulo: string | null;
  bio: string | null;
  matricula: string | null;
  provincia: string | null;
  habilidades: string[];
  /** Legacy (texto libre). Ya no se escribe: se conserva hasta validar la migración a profesional_motivos. */
  motivos: string[];
  modalidad: Modalidad;
  precio: number | null;
  whatsapp: string | null;
  avatar_url: string | null;
  estado: EstadoProfesional;
  rating: number;
  resenas_count: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Horario {
  id: string;
  profesional_id: string;
  dia_semana: number;
  hora: string;
  created_at: string;
}

export interface ProfesionalConHorarios extends Profesional {
  horarios: Horario[];
}

export interface MotivoConsulta {
  id: string;
  especialidad: string;
  motivo: string;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfesionalMotivo {
  profesional_id: string;
  motivo_id: string;
  created_at: string;
}

/** Perfil público: horarios + motivos activos de la lista maestra. */
export interface ProfesionalConDetalle extends ProfesionalConHorarios {
  motivosConsulta: MotivoConsulta[];
}

export interface MotivoInput {
  especialidad: string;
  motivo: string;
  notas: string;
}

export interface ProfesionalAdmin extends Profesional {
  profile: Pick<Profile, 'email'> | null;
}

export interface Turno {
  id: string;
  profesional_id: string;
  fecha: string;
  hora: string;
  pac_nombre: string;
  pac_email: string;
  pac_whatsapp: string | null;
  pac_motivo: string | null;
  estado: EstadoTurno;
  created_at: string;
  updated_at: string;
}

export interface TurnoConProfesional extends Turno {
  profesional: Pick<Profesional, 'nombre' | 'slug'> | null;
}

export interface Resena {
  id: string;
  profesional_id: string;
  puntuacion: number;
  nombre: string | null;
  comentario: string | null;
  estado: EstadoResena;
  created_at: string;
  updated_at: string;
}

export interface ResenaConProfesional extends Resena {
  profesional: Pick<Profesional, 'nombre' | 'slug'> | null;
}

export interface FiltrosBusqueda {
  q: string;
  especialidad: string;
  provincia: string;
  modalidad: '' | Modalidad;
  motivo: string;
  orden: Orden;
}

export interface ReservaInput {
  profesionalId: string;
  fecha: string;
  hora: string;
  nombre: string;
  email: string;
  whatsapp?: string;
  motivo?: string;
}

export interface PerfilEditable {
  nombre: string;
  especialidad: string;
  subtitulo: string | null;
  matricula?: string | null;
  provincia: string | null;
  bio: string | null;
  habilidades: string[];
  modalidad: Modalidad;
  precio: number | null;
  whatsapp: string | null;
  estado?: EstadoProfesional;
}

export interface RegistroInput {
  nombre: string;
  email: string;
  password: string;
  especialidad: string;
  subtitulo: string;
  matricula: string;
  provincia: string;
  bio: string;
  habilidades: string[];
  /** IDs de motivos_consulta (validados en la base). */
  motivoIds: string[];
  modalidad: Modalidad;
  precio: number | null;
  whatsapp: string;
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;
