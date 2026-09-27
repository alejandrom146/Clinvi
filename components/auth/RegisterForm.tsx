'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button, { buttonClasses } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { registrarProfesional } from '@/lib/actions/auth';
import { ESPECIALIDAD_NOMBRES, MODALIDADES, PROVINCIAS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { splitList } from '@/lib/utils';
import { hasErrors, isEmail, isWhatsapp, parsePrecio, validateAvatar, validateMotivos, type Errores } from '@/lib/validation';
import MotivosSelector from '@/components/motivos/MotivosSelector';
import { confirmarCambioEspecialidad, motivosDeEspecialidad } from '@/lib/motivos';
import type { Modalidad, MotivoConsulta } from '@/types';

interface FormState {
  nombre: string;
  email: string;
  password: string;
  password2: string;
  especialidad: string;
  subtitulo: string;
  matricula: string;
  provincia: string;
  bio: string;
  habilidades: string;
  modalidad: Modalidad;
  precio: string;
  whatsapp: string;
}

type Campo = keyof FormState | 'avatar' | 'motivos';

const INICIAL: FormState = {
  nombre: '',
  email: '',
  password: '',
  password2: '',
  especialidad: '',
  subtitulo: '',
  matricula: '',
  provincia: '',
  bio: '',
  habilidades: '',
  modalidad: 'virtual',
  precio: '',
  whatsapp: '',
};

function validar(f: FormState, avatar: File | null): Errores<Campo> {
  const e: Errores<Campo> = {};
  if (f.nombre.trim().length < 2) e.nombre = 'Ingresá tu nombre completo.';
  if (!isEmail(f.email)) e.email = 'Ingresá un email válido.';
  if (f.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres.';
  if (f.password2 !== f.password) e.password2 = 'Las contraseñas no coinciden.';
  if (!f.especialidad) e.especialidad = 'Elegí tu especialidad.';
  if (f.matricula.trim().length < 3) e.matricula = 'Ingresá tu número de matrícula.';
  if (!f.provincia) e.provincia = 'Elegí tu provincia.';
  if (f.bio.trim().length < 30) e.bio = 'Contá un poco más sobre vos (mínimo 30 caracteres).';
  if (parsePrecio(f.precio) === 'invalid') e.precio = 'Ingresá un precio válido (solo números).';
  if (!isWhatsapp(f.whatsapp)) e.whatsapp = 'Ingresá un WhatsApp válido con código de país y área.';
  const avatarError = validateAvatar(avatar);
  if (avatarError) e.avatar = avatarError;
  return e;
}

export default function RegisterForm({ motivos }: { motivos: MotivoConsulta[] }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(INICIAL);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [motivoIds, setMotivoIds] = useState<string[]>([]);
  const [errores, setErrores] = useState<Errores<Campo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ requiereConfirmacion: boolean; avatarSubido: boolean } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
    if (errores[key]) setErrores((prev) => ({ ...prev, [key]: undefined }));
  }

  function cambiarEspecialidad(nueva: string) {
    const r = confirmarCambioEspecialidad(motivoIds, motivos, nueva);
    if (r === null) return;
    setMotivoIds(r);
    set('especialidad', nueva);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const v = validar(f, avatar);
    const errMotivos = validateMotivos(motivoIds, motivosDeEspecialidad(motivos, f.especialidad).length);
    if (errMotivos) v.motivos = errMotivos;
    setErrores(v);
    if (hasErrors(v)) {
      setError('Revisá los campos marcados.');
      return;
    }
    setLoading(true);
    try {
      const precio = parsePrecio(f.precio);
      const res = await registrarProfesional(
        {
          nombre: f.nombre,
          email: f.email,
          password: f.password,
          especialidad: f.especialidad,
          subtitulo: f.subtitulo,
          matricula: f.matricula,
          provincia: f.provincia,
          bio: f.bio,
          habilidades: splitList(f.habilidades),
          motivoIds,
          modalidad: f.modalidad,
          precio: precio === 'invalid' ? null : precio,
          whatsapp: f.whatsapp,
        },
        avatar,
      );
      setResultado(res);
      if (!res.requiereConfirmacion) router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (resultado) {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest" aria-hidden="true" />
        <h2 className="text-xl font-bold text-ink">¡Registro recibido!</h2>
        <p className="text-sm leading-relaxed text-muted">
          Tu perfil quedó en estado <strong className="text-ink">pendiente</strong>. Un administrador va a verificar tu matrícula antes de publicarlo en el
          buscador.
        </p>
        {resultado.requiereConfirmacion && (
          <Alert variant="info">Te enviamos un email para confirmar tu cuenta. Confirmalo y después ingresá para completar tus horarios.</Alert>
        )}
        {avatar && !resultado.avatarSubido && <Alert variant="warning">Podés subir tu foto desde “Editar perfil” en tu panel.</Alert>}
        <Link href={resultado.requiereConfirmacion ? '/ingresar' : '/panel'} className={buttonClasses('primary', 'md', 'w-full')}>
          {resultado.requiereConfirmacion ? 'Ir a ingresar' : 'Ir a mi panel'}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-[18px]" noValidate>
      <fieldset className="space-y-4 rounded-[14px] border border-line-light bg-white p-5 shadow-clinvi-sm sm:px-[26px] sm:py-[22px] [&>legend+*]:!mt-0 [&>legend+*]:clear-both">
        <legend className="float-left mb-4 w-full text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Cuenta</legend>
        <Field label="Nombre completo" htmlFor="nombre" error={errores.nombre} required hint="Como querés que lo vean los pacientes, ej: Lic. Ana Gómez">
          <Input id="nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} invalid={Boolean(errores.nombre)} autoComplete="name" maxLength={120} />
        </Field>
        <Field label="Email" htmlFor="email" error={errores.email} required>
          <Input id="email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errores.email)} autoComplete="email" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contraseña" htmlFor="password" error={errores.password} required>
            <Input id="password" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} invalid={Boolean(errores.password)} autoComplete="new-password" />
          </Field>
          <Field label="Repetir contraseña" htmlFor="password2" error={errores.password2} required>
            <Input id="password2" type="password" value={f.password2} onChange={(e) => set('password2', e.target.value)} invalid={Boolean(errores.password2)} autoComplete="new-password" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-[14px] border border-line-light bg-white p-5 shadow-clinvi-sm sm:px-[26px] sm:py-[22px] [&>legend+*]:!mt-0 [&>legend+*]:clear-both">
        <legend className="float-left mb-4 w-full text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Datos profesionales</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Especialidad" htmlFor="especialidad" error={errores.especialidad} required>
            <Select id="especialidad" value={f.especialidad} onChange={(e) => cambiarEspecialidad(e.target.value)} invalid={Boolean(errores.especialidad)}>
              <option value="">Elegí una opción</option>
              {ESPECIALIDAD_NOMBRES.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Matrícula" htmlFor="matricula" error={errores.matricula} required>
            <Input id="matricula" value={f.matricula} onChange={(e) => set('matricula', e.target.value)} invalid={Boolean(errores.matricula)} placeholder="Ej: MN 12.345" />
          </Field>
          <Field label="Provincia" htmlFor="provincia" error={errores.provincia} required>
            <Select id="provincia" value={f.provincia} onChange={(e) => set('provincia', e.target.value)} invalid={Boolean(errores.provincia)}>
              <option value="">Elegí una opción</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Modalidad" htmlFor="modalidad" required>
            <Select id="modalidad" value={f.modalidad} onChange={(e) => set('modalidad', e.target.value as Modalidad)}>
              {MODALIDADES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Subtítulo" htmlFor="subtitulo" hint="Una línea breve, ej: Psicóloga clínica · Terapia cognitivo-conductual">
          <Input id="subtitulo" value={f.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} maxLength={160} />
        </Field>
        <Field label="Presentación" htmlFor="bio" error={errores.bio} required>
          <Textarea id="bio" value={f.bio} onChange={(e) => set('bio', e.target.value)} invalid={Boolean(errores.bio)} maxLength={3000} />
        </Field>
        <Field label="Habilidades" htmlFor="habilidades" hint="Separadas por coma, ej: Adultos, Terapia online, Parejas">
          <Input id="habilidades" value={f.habilidades} onChange={(e) => set('habilidades', e.target.value)} />
        </Field>
        <MotivosSelector
          especialidad={f.especialidad}
          motivos={motivos}
          value={motivoIds}
          onChange={(ids) => {
            setMotivoIds(ids);
            if (errores.motivos) setErrores((prev) => ({ ...prev, motivos: undefined }));
          }}
          error={errores.motivos}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio de la consulta (ARS)" htmlFor="precio" error={errores.precio} hint="Dejalo vacío para “A convenir”">
            <Input id="precio" inputMode="numeric" value={f.precio} onChange={(e) => set('precio', e.target.value)} invalid={Boolean(errores.precio)} placeholder="15000" />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={errores.whatsapp} required>
            <Input id="whatsapp" type="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} invalid={Boolean(errores.whatsapp)} placeholder="5493511234567" />
          </Field>
        </div>
        <Field label="Foto / avatar" htmlFor="avatar" error={errores.avatar} hint="JPG, PNG o WebP, máximo 2 MB">
          <Input
            id="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setAvatar(e.target.files?.[0] ?? null);
              setErrores((prev) => ({ ...prev, avatar: undefined }));
            }}
            className="py-2 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800"
          />
        </Field>
      </fieldset>

      <Alert variant="info">Tu perfil quedará pendiente hasta que un administrador verifique tu matrícula. Recién ahí aparecerá en el buscador.</Alert>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Crear mi cuenta profesional
      </Button>
      <p className="text-center text-sm text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link href="/ingresar" className="font-semibold text-forest hover:text-forest-mid hover:underline">
          Ingresá
        </Link>
      </p>
    </form>
  );
}
