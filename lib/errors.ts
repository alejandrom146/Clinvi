const CODIGOS: Record<string, string> = {
  HORARIO_OCUPADO: 'Este horario ya fue reservado. Elegí otro horario.',
  HORARIO_PASADO: 'Ese horario ya pasó. Elegí otro horario.',
  HORARIO_INEXISTENTE: 'Ese horario no está disponible para este profesional.',
  FECHA_INVALIDA: 'La fecha elegida no es válida.',
  PROFESIONAL_NO_DISPONIBLE: 'Este profesional no está recibiendo reservas en este momento.',
  DATOS_INVALIDOS: 'Revisá los datos ingresados: nombre y email son obligatorios.',
  MOTIVOS_MAXIMO: 'Podés elegir como máximo 8 motivos de consulta.',
  MOTIVOS_MINIMO: 'Elegí al menos 1 motivo de consulta.',
  MOTIVO_INVALIDO: 'Alguno de los motivos elegidos no corresponde a la especialidad o ya no está disponible. Revisá la selección.',
  MOTIVO_OTRA_ESPECIALIDAD: 'Solo podés elegir motivos de tu especialidad.',
  MOTIVO_INACTIVO: 'Alguno de los motivos elegidos ya no está disponible.',
  MOTIVO_DUPLICADO: 'Ya existe ese motivo para esta especialidad.',
  MOTIVO_ESPECIALIDAD_FIJA: 'No se puede cambiar la especialidad de un motivo que ya usan profesionales. Creá uno nuevo en la otra especialidad.',
  COBERTURA_INVALIDA: 'Alguna de las coberturas elegidas no existe o ya no está disponible. Revisá la selección.',
  COBERTURA_INACTIVA: 'Alguna de las coberturas elegidas ya no está disponible.',
  COBERTURA_DUPLICADA: 'Ya existe una cobertura con ese nombre (o esa sigla) en la misma provincia.',
  BUSQUEDA_FALLIDA: 'No pudimos completar la búsqueda. Intentá nuevamente en unos minutos.',
  NO_AUTORIZADO: 'No tenés permisos para realizar esta acción.',
};

const MENSAJES: Array<[string, string]> = [
  ['Invalid login credentials', 'Email o contraseña incorrectos.'],
  ['Email not confirmed', 'Tenés que confirmar tu email antes de ingresar. Revisá tu casilla de correo.'],
  ['User already registered', 'Ya existe una cuenta con ese email.'],
  ['Password should be at least', 'La contraseña debe tener al menos 6 caracteres.'],
  ['New password should be different', 'La nueva contraseña debe ser distinta a la anterior.'],
  ['Auth session missing', 'El enlace expiró o no es válido. Pedí uno nuevo.'],
  ['rate limit', 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'],
  ['Failed to fetch', 'No se pudo conectar con el servidor. Revisá tu conexión y la configuración de Supabase.'],
  ['Database error saving new user', 'No pudimos crear tu perfil. Verificá que se haya ejecutado supabase/schema.sql.'],
  ['row-level security', 'No tenés permisos para realizar esta acción.'],
  ['check constraint', 'Algún dato no tiene un formato válido.'],
  ['Bucket not found', 'Falta el bucket "avatars" en Supabase Storage. Ejecutá supabase/schema.sql.'],
  ['public.motivos_consulta', 'Falta ejecutar supabase/motivos_consulta.sql en Supabase.'],
  ['public.profesional_motivos', 'Falta ejecutar supabase/motivos_consulta.sql en Supabase.'],
  ['public.set_profesional_motivos', 'Falta ejecutar supabase/motivos_consulta.sql en Supabase.'],
  ['public.coberturas', 'Falta ejecutar supabase/coberturas.sql en Supabase.'],
  ['public.profesional_coberturas', 'Falta ejecutar supabase/coberturas.sql en Supabase.'],
  ['public.set_profesional_coberturas', 'Falta ejecutar supabase/coberturas.sql en Supabase.'],
  ['Supabase no configurado', ''],
];

function readField(error: unknown, field: 'message' | 'code'): string {
  if (typeof error === 'object' && error !== null && field in error) {
    const value = (error as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

/** Traduce errores de Supabase/red a mensajes claros en español. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error. Intentá nuevamente.'): string {
  if (!error) return fallback;
  const message = typeof error === 'string' ? error : readField(error, 'message');
  const code = readField(error, 'code');

  for (const [clave, texto] of Object.entries(CODIGOS)) {
    if (message.includes(clave)) return texto;
  }
  for (const [clave, texto] of MENSAJES) {
    if (message.toLowerCase().includes(clave.toLowerCase())) return texto || message;
  }
  if (code === '23505') return 'Ese registro ya existe.';
  if (code === '42501') return 'No tenés permisos para realizar esta acción.';
  return message || fallback;
}
